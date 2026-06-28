(function(){
  'use strict';
  const SHEET_API = '/api/sheet';
  const OVERRIDE_API = '/api/admin/overrides';
  const SUBMISSIONS_API = '/api/submissions';
  const APPROVE_SUBMISSION_API = '/api/admin/approveSubmission';
  const DELETE_SUBMISSION_API = '/api/admin/submission';

  const tokenInput = document.getElementById('admin-token');
  const saveTokenBtn = document.getElementById('save-token');
  const refreshBtn = document.getElementById('refresh');
  const viewSheetBtn = document.getElementById('view-sheet');
  const viewSubmissionsBtn = document.getElementById('view-submissions');
  const tbody = document.getElementById('tbody');
  const searchInput = document.getElementById('search');
  let currentView = 'sheet';

  function getToken(){ return localStorage.getItem('dj_admin_token') || ''; }
  function setToken(t){ localStorage.setItem('dj_admin_token', t); }
  tokenInput.value = getToken();
  saveTokenBtn.addEventListener('click', ()=>{ setToken(tokenInput.value.trim()); alert('Token guardado en localStorage'); });

  saveTokenBtn.title = 'Guarda el token que pusiste en la variable de entorno ADMIN_PASS';

  function parseCSV(csvText){
    const lines = csvText.split(/\r?\n/).filter(l=>l.trim()!='');
    if (lines.length<2) return [];
    const delimiter = (lines[0].includes(';') && !lines[0].includes(',')) ? ';' : ',';
    function splitRow(row){
      const res=[]; let cur=''; let inQ=false;
      for (let i=0;i<row.length;i++){ const ch=row[i]; if (ch=='"'){ inQ=!inQ; } else if (ch==delimiter && !inQ){ res.push(cur.trim()); cur=''; } else cur+=ch; }
      res.push(cur.trim()); return res.map(v=>v.replace(/^"|"$/g,'').trim());
    }
    const headers = splitRow(lines[0]);
    const data = [];
    for (let i=1;i<lines.length;i++){ const row = splitRow(lines[i]); if (row.length < headers.length) continue; const obj={}; headers.forEach((h,idx)=> obj[h]=row[idx]||''); data.push(obj); }
    return data;
  }

  function normalizeText(value){ return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,''); }
  function makeId(a,b,c,d){ return encodeURIComponent((normalizeText(a||'') + '_' + normalizeText(b||'') + '_' + String(c||'') + '_' + String(d||'')).replace(/[^a-z0-9_\-]/g,'')); }

  async function loadData(){
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#8899aa;padding:18px">Cargando...</td></tr>';
    try{
      if (currentView === 'submissions') {
        const submissions = await fetchSubmissions();
        renderSubmissions(submissions);
        return;
      }

      const r = await fetch(SHEET_API + '?t=' + Date.now());
      if (!r.ok) throw new Error('No se pudo leer la hoja');
      const csv = await r.text();
      const raw = parseCSV(csv);
      const overrides = await fetchOverrides();
      const rows = mergeOverrides(raw, overrides);
      renderTable(rows);
    }catch(e){ tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#ffbb88;padding:18px">'+(e.message||e)+'</td></tr>'; }
  }

  async function fetchOverrides(){
    const token = getToken();
    if (!token) return {};
    try{
      const r = await fetch(OVERRIDE_API, { headers: { 'x-admin-token': token } });
      if (!r.ok) throw new Error('No autorizado o error al leer overrides');
      return await r.json();
    }catch(e){ console.warn('Overrides load failed', e); return {}; }
  }

  async function fetchSubmissions(){
    const token = getToken();
    if (!token) throw new Error('Necesitas token admin para ver submissions');
    const r = await fetch(SUBMISSIONS_API, { headers: { 'x-admin-token': token } });
    if (!r.ok) throw new Error('No autorizado o error al leer submissions');
    return await r.json();
  }

  function mergeOverrides(rawData, overrides){
    const rows = rawData.map(row => {
      const id = makeId(row['DJ']||row['dj']||row['Name']||row['name']||'', row['Venue']||row['venue']||'', row['Fecha']||row['Date']||'', row['Inicio']||row['Start']||row['hora inicio']||'');
      const override = overrides[id] || {};
      return Object.assign({}, row, override, { id });
    });
    Object.entries(overrides).forEach(([id, override]) => {
      if (!rows.some(r=>r.id === id)) {
        rows.push(Object.assign({}, override, { id }));
      }
    });
    return rows;
  }

  function renderTable(rows){
    const q = (searchInput.value||'').toLowerCase();
    const filtered = rows.filter(r=>{
      if (!q) return true;
      return Object.values(r).some(v=> String(v||'').toLowerCase().includes(q));
    });
    if (!filtered.length) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#8899aa;padding:18px">No hay resultados</td></tr>'; return; }
    tbody.innerHTML = '';
    for (const r of filtered){
      const status = (r.override && r.override.estado) || r['Estado'] || r['estado'] || '';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${status ? '<span class="badge">'+status+'</span>' : '<span style="color:#8899aa">pendiente</span>'}</td>
        <td><div contenteditable class="inline-edit dj-name">${r['DJ']||r['dj']||r['Name']||r['name']||''}</div></td>
        <td class="col-edit"><div contenteditable class="inline-edit venue">${r['Venue']||r['venue']||''}</div></td>
        <td>${r['Fecha']||r['Date']||''}</td>
        <td><div contenteditable class="inline-edit start">${r['Inicio']||r['Start']||r['start']||r['hora inicio']||''}</div></td>
        <td><div contenteditable class="inline-edit end">${r['Fin']||r['End']||r['end']||r['hora fin']||''}</div></td>
        <td><div contenteditable class="inline-edit style">${r['Style']||r['Estilo']||r['style']||r['estilo']||''}</div></td>
        <td class="controls">
          <button class="btn save">Guardar</button>
          <button class="btn del">Borrar override</button>
        </td>
      `;
      const saveBtn = tr.querySelector('.save');
      const delBtn = tr.querySelector('.del');
      saveBtn.addEventListener('click', ()=> saveOverride(r.id, tr));
      delBtn.addEventListener('click', ()=> deleteOverride(r.id));
      tbody.appendChild(tr);
    }
  }

  function renderSubmissions(rows){
    const q = (searchInput.value||'').toLowerCase();
    const filtered = rows.filter(r=>{
      if (!q) return true;
      return Object.values(r).some(v=> String(v||'').toLowerCase().includes(q));
    });
    if (!filtered.length) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#8899aa;padding:18px">No hay submissions</td></tr>'; return; }
    tbody.innerHTML = '';
    for (const r of filtered){
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="badge">Nueva</span></td>
        <td>${r.dj || ''}</td>
        <td>${r.venue || ''}</td>
        <td>${r.date || ''}</td>
        <td>${r.start || ''}</td>
        <td></td>
        <td></td>
        <td class="controls">
          <button class="btn save">Aprobar</button>
          <button class="btn del">Eliminar</button>
        </td>
      `;
      const saveBtn = tr.querySelector('.save');
      const delBtn = tr.querySelector('.del');
      saveBtn.addEventListener('click', ()=> approveSubmission(r.id));
      delBtn.addEventListener('click', ()=> deleteSubmission(r.id));
      tbody.appendChild(tr);
    }
  }

  async function saveOverride(id, tr){
    const token = getToken();
    if (!token){ alert('Guarda el token admin primero'); return; }
    const override = {
      DJ: tr.querySelector('.dj-name').textContent.trim(),
      Venue: tr.querySelector('.venue').textContent.trim(),
      Inicio: tr.querySelector('.start').textContent.trim(),
      Fin: tr.querySelector('.end').textContent.trim(),
      style: tr.querySelector('.style').textContent.trim(),
      estado: 'aprobado'
    };
    try{
      const r = await fetch(OVERRIDE_API, { method: 'POST', headers: { 'content-type':'application/json','x-admin-token': token }, body: JSON.stringify({ id, override }) });
      if (!r.ok) throw new Error('Error guardando override');
      alert('Guardado'); loadData();
    }catch(e){ alert('Error: '+e.message); }
  }

  async function deleteOverride(id){
    const token = getToken(); if (!token){ alert('Guarda token'); return; }
    if (!confirm('Eliminar override?')) return;
    try{
      const r = await fetch(OVERRIDE_API + '/' + encodeURIComponent(id), { method: 'DELETE', headers: { 'x-admin-token': token } });
      if (!r.ok) throw new Error('Error borrando override');
      alert('Override eliminado'); loadData();
    }catch(e){ alert('Error: '+e.message); }
  }

  async function approveSubmission(id){
    const token = getToken(); if (!token){ alert('Guarda token'); return; }
    try{
      const r = await fetch(APPROVE_SUBMISSION_API, { method: 'POST', headers: { 'content-type':'application/json','x-admin-token': token }, body: JSON.stringify({ id }) });
      if (!r.ok) {
        const data = await r.json().catch(()=>({}));
        throw new Error(data.error || 'Error aprobando submission');
      }
      alert('Submission aprobada'); loadData();
    }catch(e){ alert('Error: '+e.message); }
  }

  async function deleteSubmission(id){
    const token = getToken(); if (!token){ alert('Guarda token'); return; }
    if (!confirm('Eliminar submission?')) return;
    try{
      const r = await fetch(DELETE_SUBMISSION_API + '/' + encodeURIComponent(id), { method: 'DELETE', headers: { 'x-admin-token': token } });
      if (!r.ok) throw new Error('Error borrando submission');
      alert('Submission eliminada'); loadData();
    }catch(e){ alert('Error: '+e.message); }
  }

  viewSheetBtn.addEventListener('click', ()=> setView('sheet'));
  viewSubmissionsBtn.addEventListener('click', ()=> setView('submissions'));
  refreshBtn.addEventListener('click', loadData);
  searchInput.addEventListener('input', ()=> loadData());

  function setView(view){
    currentView = view;
    viewSheetBtn.style.opacity = view === 'sheet' ? '1' : '0.6';
    viewSubmissionsBtn.style.opacity = view === 'submissions' ? '1' : '0.6';
    loadData();
  }

  setView('sheet');
})();
