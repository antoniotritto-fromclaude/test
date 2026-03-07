// ========================================
// CONFIGURAZIONE GLOBALE v3.0
// ========================================
var CONFIG = {
  SHEET_NAMES: {
    DATABASE: '📊 DATABASE CLIENTI',
    KANBAN: '🎯 KANBAN PIPELINE',
    DASHBOARD: '💰 DASHBOARD REVENUE',
    ANALISI: '📈 ANALISI CONVERSIONE',
    CASHFLOW: '💵 PREVISIONI CASH FLOW'
  },
  STADI_PIPELINE: ['Prospect','Lead','Primo Contatto','Appuntamento','Secondo Appuntamento','Chiusura'],
  FONTI_LEAD: ['Referral','Newsletter','LinkedIn','Altri Social','Fiere','Referral Cliente','Passaparola'],
  CLUSTER_CLIENTE: ['Dipendente','Azienda','Professionista','Imprenditore'],
  TIPO_CLIENTE: ['Potenziale','Già Cliente'],
  TIPO_CONTATTO: ['Email','Telefono','SMS','WhatsApp'],
  TIPO_FEE: ['Management Fee','Fee Only','IUNP 36'],
  ALERT_THRESHOLDS: {'Secondo Appuntamento':7,'Appuntamento':14,'Primo Contatto':30,'Lead':45,'Prospect':60},
  GIORNI_CHIUSURA: {'Prospect':90,'Lead':75,'Primo Contatto':60,'Appuntamento':45,'Secondo Appuntamento':15},
  MANAGEMENT_FEE_PERC: 0.45,
  FEE_ONLY_PERC: 0.9,
  IUNP_PERC: 18.0,
  EMAIL_NOTIFICHE: 'antoniotritto@gmail.com'
};

// =====================================================
// MENU COMPLETO v3.0
// =====================================================
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('📊 Private Banker CRM')
    .addItem('➕ Nuovo Lead Potenziale', 'mostraFormNuovoLead')
    .addItem('📞 Registra Follow-up', 'mostraFormRegistraFollowup')
    .addItem('💰 Stima Chiusura', 'mostraFormStimaChiusura')
    .addItem('✅ Converti in Cliente', 'mostraFormConvertiCliente')
    .addSeparator()
    .addSubMenu(ui.createMenu('📊 Dashboard & Report')
      .addItem('🔄 Aggiorna TUTTO', 'aggiornaTuttiIDashboard')
      .addItem('💰 Solo Dashboard Revenue', 'aggiornaDashboardRevenue')
      .addItem('💵 Solo Cash Flow', 'aggiornaCashFlow')
      .addItem('🎯 Solo Kanban Pipeline', 'aggiornaKanban')
      .addItem('📈 Solo Analisi Conversione', 'aggiornaAnalisiConversione')
    )
    .addSeparator()
    .addSubMenu(ui.createMenu('⚙️ Configurazione')
      .addItem('🏗️ Completa Struttura Fogli', 'completaStruttura')
      .addItem('🎨 Applica Formattazione', 'applicaFormattazioneCompleta')
      .addItem('📋 Setup Dropdown & Validazioni', 'setupIniziale')
      .addItem('⏰ Installa Alert Giornaliero', 'installaTriggerGiornaliero')
      .addItem('🗑️ Rimuovi Alert Giornaliero', 'rimuoviTriggerGiornaliero')
      .addItem('📧 Test Email Alert (Invio Immediato)', 'testAlertEmail')
    )
    .addSeparator()
    .addItem('ℹ️ Guida Rapida', 'mostraGuida')
    .addToUi();
}

// =====================================================
// FORM: NUOVO LEAD POTENZIALE
// =====================================================
function mostraFormNuovoLead() {
  var html = HtmlService.createHtmlOutput(getFormNuovoLeadHTML())
    .setWidth(550).setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(html, '➕ Aggiungi Nuovo Lead Potenziale');
}
function getFormNuovoLeadHTML() {
  return '<html><head><base target="_top"><style>' +
    '* { box-sizing: border-box; margin: 0; padding: 0; }' +
    'body { font-family: "Google Sans", "Segoe UI", Arial, sans-serif; padding: 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }' +
    '.form-container { background: white; padding: 28px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }' +
    'h2 { color: #1a237e; margin-bottom: 24px; font-size: 22px; text-align: center; border-bottom: 3px solid #667eea; padding-bottom: 12px; }' +
    '.form-group { margin-bottom: 20px; }' +
    'label { display: block; margin-bottom: 8px; font-weight: 600; color: #37474f; font-size: 14px; }' +
    '.required::after { content: " *"; color: #d32f2f; font-weight: bold; }' +
    'input, select, textarea { width: 100%; padding: 12px 14px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 14px; font-family: inherit; transition: all 0.3s ease; }' +
    'input:focus, select:focus, textarea:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.1); }' +
    '.input-group { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }' +
    'textarea { resize: vertical; min-height: 70px; }' +
    '.button-group { display: flex; gap: 12px; margin-top: 28px; justify-content: flex-end; }' +
    'button { padding: 12px 28px; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 0.5px; }' +
    '.btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }' +
    '.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(102,126,234,0.4); }' +
    '.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }' +
    '.btn-secondary { background: white; color: #546e7a; border: 2px solid #e0e0e0; }' +
    '.btn-secondary:hover { background: #f5f5f5; border-color: #bdbdbd; }' +
    '.message { display: none; padding: 14px 18px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; font-weight: 500; }' +
    '.success-message { background: #e8f5e9; border-left: 4px solid #4caf50; color: #2e7d32; }' +
    '.error-message { background: #ffebee; border-left: 4px solid #f44336; color: #c62828; }' +
    '.help-text { font-size: 12px; color: #78909c; margin-top: 4px; font-style: italic; }' +
    '</style></head><body><div class="form-container">' +
    '<h2>🎯 Nuovo Lead Potenziale</h2>' +
    '<div id="successMessage" class="message success-message"></div>' +
    '<div id="errorMessage" class="message error-message"></div>' +
    '<form id="leadForm">' +
    '<div class="form-group"><label class="required">Nome e Cognome</label><input type="text" id="nome" required placeholder="es. Mario Rossi"></div>' +
    '<div class="input-group">' +
    '<div class="form-group"><label class="required">Cluster Cliente</label><select id="cluster" required><option value="">Seleziona...</option><option value="Dipendente">Dipendente</option><option value="Azienda">Azienda</option><option value="Professionista">Professionista</option><option value="Imprenditore">Imprenditore</option></select></div>' +
    '<div class="form-group"><label class="required">Fonte Lead</label><select id="fonte" required><option value="">Seleziona...</option><option value="Referral">Referral</option><option value="Newsletter">Newsletter</option><option value="LinkedIn">LinkedIn</option><option value="Altri Social">Altri Social</option><option value="Fiere">Fiere</option><option value="Referral Cliente">Referral Cliente</option><option value="Passaparola">Passaparola</option></select></div>' +
    '</div>' +
    '<div class="form-group"><label class="required">Stadio Pipeline</label><select id="stadio" required><option value="Prospect">Prospect (Identificato)</option><option value="Lead">Lead (Qualificato)</option><option value="Primo Contatto">Primo Contatto</option><option value="Appuntamento">Appuntamento Fissato</option></select><div class="help-text">Seleziona lo stadio iniziale più appropriato</div></div>' +
    '<div class="input-group">' +
    '<div class="form-group"><label class="required">Probabilità Chiusura (%)</label><input type="number" id="probabilita" min="0" max="100" required placeholder="es. 35"><div class="help-text">La tua stima di chiusura (0-100)</div></div>' +
    '<div class="form-group"><label class="required">AUM Potenziale (€)</label><input type="number" id="aumPotenziale" min="0" step="1000" required placeholder="es. 250000"></div>' +
    '</div>' +
    '<div class="form-group"><label>Note</label><textarea id="note" placeholder="Aggiungi dettagli importanti sul lead..."></textarea></div>' +
    '<div class="button-group"><button type="button" class="btn-secondary" onclick="google.script.host.close()">Annulla</button><button type="submit" class="btn-primary">💾 Salva Lead</button></div>' +
    '</form></div>' +
    '<script>' +
    'document.getElementById("leadForm").addEventListener("submit", function(e) {' +
    '  e.preventDefault();' +
    '  var submitBtn = document.querySelector(".btn-primary");' +
    '  submitBtn.disabled = true; submitBtn.textContent = "Salvataggio...";' +
    '  var leadData = {' +
    '    nome: document.getElementById("nome").value.trim(),' +
    '    cluster: document.getElementById("cluster").value,' +
    '    fonte: document.getElementById("fonte").value,' +
    '    stadio: document.getElementById("stadio").value,' +
    '    probabilita: parseInt(document.getElementById("probabilita").value),' +
    '    aumPotenziale: parseFloat(document.getElementById("aumPotenziale").value),' +
    '    note: document.getElementById("note").value.trim()' +
    '  };' +
    '  google.script.run' +
    '    .withSuccessHandler(function(result) {' +
    '      if (result.success) {' +
    '        document.getElementById("successMessage").textContent = "✅ Lead salvato! ID: " + result.id;' +
    '        document.getElementById("successMessage").style.display = "block";' +
    '        setTimeout(function() { google.script.host.close(); }, 1500);' +
    '      } else {' +
    '        document.getElementById("errorMessage").textContent = "❌ Errore: " + result.message;' +
    '        document.getElementById("errorMessage").style.display = "block";' +
    '        submitBtn.disabled = false; submitBtn.textContent = "💾 Salva Lead";' +
    '      }' +
    '    })' +
    '    .withFailureHandler(function(error) {' +
    '      document.getElementById("errorMessage").textContent = "❌ Errore: " + error.message;' +
    '      document.getElementById("errorMessage").style.display = "block";' +
    '      submitBtn.disabled = false; submitBtn.textContent = "💾 Salva Lead";' +
    '    })' +
    '    .salvaLeadPotenziale(leadData);' +
    '});' +
    '</script></body></html>';
}
function salvaLeadPotenziale(leadData) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.DATABASE);
    if (!sheet) return { success: false, message: 'Foglio DATABASE non trovato' };
    var lastRow = sheet.getLastRow();
    var rigaTotali = -1;
    if (lastRow > 1) {
      var valA = sheet.getRange(1, 1, lastRow, 1).getValues();
      for (var i = valA.length - 1; i >= 0; i--) {
        var val = String(valA[i][0]).trim().toUpperCase();
        if (val === 'TOTALI' || val === 'TOT') { rigaTotali = i + 1; break; }
      }
    }
    var insertRow;
    if (rigaTotali > 0) { sheet.insertRowBefore(rigaTotali); insertRow = rigaTotali; }
    else { insertRow = lastRow + 1; }
    var newId = 1;
    for (var j = insertRow - 1; j >= 2; j--) {
      var idVal = sheet.getRange(j, 1).getValue();
      if (typeof idVal === 'number' && idVal > 0) { newId = idVal + 1; break; }
    }
    var oggi = new Date();
    var rowData = [
      newId, leadData.nome, 'Potenziale', leadData.fonte, oggi, leadData.stadio,
      leadData.probabilita, leadData.aumPotenziale, '', '', 'In attesa', '', oggi, '',
      leadData.note, leadData.cluster, '', '', '', 'Non avviato'
    ];
    sheet.getRange(insertRow, 1, 1, rowData.length).setValues([rowData]);
    sheet.getRange(insertRow, 5).setNumberFormat('dd/mm/yyyy');
    sheet.getRange(insertRow, 8).setNumberFormat('€#,##0');
    sheet.getRange(insertRow, 13).setNumberFormat('dd/mm/yyyy');
    sheet.getRange(insertRow, 18).setNumberFormat('€#,##0.00');
    sheet.getRange(insertRow, 19).setNumberFormat('€#,##0.00');
    sheet.getRange(insertRow, 3).setBackground('#fff4e6').setFontWeight('bold');
    var colSt = {'Prospect':'#fce4ec','Lead':'#e1f5fe','Primo Contatto':'#fff9c4','Appuntamento':'#f0f4c3','Secondo Appuntamento':'#dcedc8','Chiusura':'#c8e6c9'};
    if (colSt[leadData.stadio]) sheet.getRange(insertRow, 6).setBackground(colSt[leadData.stadio]);
    return { success: true, id: newId, row: insertRow };
  } catch (error) { return { success: false, message: error.toString() }; }
}

// =====================================================
// FORM: REGISTRA FOLLOW-UP
// =====================================================
function mostraFormRegistraFollowup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.DATABASE);
  var selection = sheet.getActiveRange();
  if (!selection || selection.getRow() < 2) {
    SpreadsheetApp.getUi().alert('Seleziona una riga', 'Seleziona prima la riga del lead/cliente.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }
  var rowIndex = selection.getRow();
  var nomeLead = sheet.getRange(rowIndex, 2).getValue();
  var stadioAttuale = sheet.getRange(rowIndex, 6).getValue();
  var probabilitaAttuale = sheet.getRange(rowIndex, 7).getValue();
  var stadi = CONFIG.STADI_PIPELINE.map(function(s) {
    return s === stadioAttuale ? '<option value="' + s + '" selected>' + s + ' (Attuale)</option>' : '<option value="' + s + '">' + s + '</option>';
  }).join('');
  var htmlContent = '<html><head><base target="_top"><style>' +
    '* { box-sizing: border-box; margin: 0; padding: 0; }' +
    'body { font-family: "Google Sans", Arial, sans-serif; padding: 24px; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }' +
    '.form-container { background: white; padding: 28px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }' +
    '.lead-info { background: linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%); padding: 16px 20px; border-radius: 8px; margin-bottom: 24px; border-left: 5px solid #00acc1; }' +
    '.lead-info h3 { margin: 0 0 8px 0; color: #006064; font-size: 18px; }' +
    '.lead-info p { margin: 4px 0; color: #00838f; font-size: 14px; font-weight: 500; }' +
    'h2 { color: #004d40; margin-bottom: 24px; font-size: 20px; text-align: center; }' +
    '.form-group { margin-bottom: 20px; }' +
    'label { display: block; margin-bottom: 8px; font-weight: 600; color: #37474f; font-size: 14px; }' +
    '.required::after { content: " *"; color: #d32f2f; }' +
    'input, select, textarea { width: 100%; padding: 12px 14px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 14px; font-family: inherit; }' +
    'input:focus, select:focus, textarea:focus { outline: none; border-color: #00acc1; }' +
    'textarea { resize: vertical; min-height: 80px; }' +
    '.input-group { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }' +
    '.button-group { display: flex; gap: 12px; margin-top: 28px; justify-content: flex-end; }' +
    'button { padding: 12px 28px; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; text-transform: uppercase; }' +
    '.btn-primary { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; }' +
    '.btn-secondary { background: white; color: #546e7a; border: 2px solid #e0e0e0; }' +
    '.message { display: none; padding: 14px 18px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; }' +
    '.success-message { background: #e8f5e9; border-left: 4px solid #4caf50; color: #2e7d32; }' +
    '.error-message { background: #ffebee; border-left: 4px solid #f44336; color: #c62828; }' +
    '</style></head><body><div class="form-container">' +
    '<h2>📞 Registra Interazione & Follow-up</h2>' +
    '<div class="lead-info"><h3>👤 ' + nomeLead + '</h3><p>📊 Stadio: <strong>' + stadioAttuale + '</strong> | Prob: <strong>' + probabilitaAttuale + '%</strong></p></div>' +
    '<div id="successMessage" class="message success-message"></div>' +
    '<div id="errorMessage" class="message error-message"></div>' +
    '<form id="followupForm"><input type="hidden" id="rowIndex" value="' + rowIndex + '">' +
    '<div class="input-group">' +
    '<div class="form-group"><label class="required">Tipo Contatto</label><select id="tipoContatto" required><option value="">Seleziona...</option><option value="Email">📧 Email</option><option value="Telefono">📞 Telefono</option><option value="SMS">💬 SMS</option><option value="WhatsApp">💚 WhatsApp</option></select></div>' +
    '<div class="form-group"><label class="required">Data Contatto</label><input type="date" id="dataContatto" required></div>' +
    '</div>' +
    '<div class="form-group"><label class="required">Note Brevi Interazione</label><textarea id="noteInterazione" required placeholder="Cosa è successo?"></textarea></div>' +
    '<div class="input-group">' +
    '<div class="form-group"><label>Aggiorna Stadio?</label><select id="nuovoStadio">' + stadi + '</select></div>' +
    '<div class="form-group"><label>Aggiorna Probabilità?</label><input type="number" id="nuovaProbabilita" min="0" max="100" value="' + probabilitaAttuale + '"></div>' +
    '</div>' +
    '<div class="form-group"><label class="required">Prossimo Follow-up (Data)</label><input type="date" id="prossimoFollowup" required></div>' +
    '<div class="form-group"><label class="required">Note Prossimo Follow-up</label><textarea id="noteFollowup" required placeholder="Cosa devi fare la prossima volta?"></textarea></div>' +
    '<div class="button-group"><button type="button" class="btn-secondary" onclick="google.script.host.close()">Annulla</button><button type="submit" class="btn-primary">💾 Salva Follow-up</button></div>' +
    '</form></div>' +
    '<script>' +
    'document.getElementById("dataContatto").valueAsDate = new Date();' +
    'var sette = new Date(); sette.setDate(sette.getDate() + 7); document.getElementById("prossimoFollowup").valueAsDate = sette;' +
    'document.getElementById("followupForm").addEventListener("submit", function(e) {' +
    '  e.preventDefault();' +
    '  var btn = document.querySelector(".btn-primary"); btn.disabled = true; btn.textContent = "Salvataggio...";' +
    '  var data = {' +
    '    rowIndex: parseInt(document.getElementById("rowIndex").value),' +
    '    tipoContatto: document.getElementById("tipoContatto").value,' +
    '    dataContatto: document.getElementById("dataContatto").value,' +
    '    noteInterazione: document.getElementById("noteInterazione").value.trim(),' +
    '    nuovoStadio: document.getElementById("nuovoStadio").value,' +
    '    nuovaProbabilita: parseInt(document.getElementById("nuovaProbabilita").value),' +
    '    prossimoFollowup: document.getElementById("prossimoFollowup").value,' +
    '    noteFollowup: document.getElementById("noteFollowup").value.trim()' +
    '  };' +
    '  google.script.run.withSuccessHandler(function(r) {' +
    '    if (r.success) { document.getElementById("successMessage").textContent = "✅ Follow-up registrato!"; document.getElementById("successMessage").style.display = "block"; setTimeout(function(){google.script.host.close();},1500); }' +
    '    else { document.getElementById("errorMessage").textContent = "❌ " + r.message; document.getElementById("errorMessage").style.display = "block"; btn.disabled = false; btn.textContent = "💾 Salva Follow-up"; }' +
    '  }).withFailureHandler(function(err) {' +
    '    document.getElementById("errorMessage").textContent = "❌ " + err.message; document.getElementById("errorMessage").style.display = "block"; btn.disabled = false; btn.textContent = "💾 Salva Follow-up";' +
    '  }).registraFollowup(data);' +
    '});' +
    '</script></body></html>';
  var html = HtmlService.createHtmlOutput(htmlContent).setWidth(550).setHeight(650);
  SpreadsheetApp.getUi().showModalDialog(html, '📞 Registra Follow-up');
}

// FIX BUG 3: rimossa chiamata a _fermaFunnelSeAttivo() (funzione non definita)
function registraFollowup(followupData) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.DATABASE);
    if (!sheet) return { success: false, message: 'Foglio DATABASE non trovato' };
    var row = followupData.rowIndex;
    sheet.getRange(row, 12).setValue(followupData.tipoContatto);
    sheet.getRange(row, 13).setValue(new Date(followupData.dataContatto));
    var timestamp = Utilities.formatDate(new Date(followupData.dataContatto), Session.getScriptTimeZone(), 'dd/MM/yyyy');
    var notaFormattata = '[' + timestamp + ' - ' + followupData.tipoContatto + '] ' + followupData.noteInterazione;
    sheet.getRange(row, 14).setValue(notaFormattata);
    if (followupData.nuovoStadio) {
      sheet.getRange(row, 6).setValue(followupData.nuovoStadio);
      var giorniChiusura = CONFIG.GIORNI_CHIUSURA[followupData.nuovoStadio] || 60;
      var nuovaDataChiusura = new Date(Date.now() + (giorniChiusura * 24 * 60 * 60 * 1000));
      sheet.getRange(row, 26).setValue(nuovaDataChiusura);
    }
    if (followupData.nuovaProbabilita) { sheet.getRange(row, 7).setValue(followupData.nuovaProbabilita); }
    sheet.getRange(row, 23).setValue(new Date(followupData.prossimoFollowup));
    sheet.getRange(row, 24).setValue(followupData.noteFollowup);
    var noteAttuali = sheet.getRange(row, 19).getValue() || '';
    sheet.getRange(row, 19).setValue(noteAttuali + (noteAttuali ? '\n' : '') + notaFormattata);
    sheet.getRange(row, 13).setNumberFormat('dd/mm/yyyy');
    sheet.getRange(row, 23).setNumberFormat('dd/mm/yyyy');
    sheet.getRange(row, 26).setNumberFormat('dd/mm/yyyy');
    applicaFormattazioneRiga(sheet, row);
    // RIMOSSO: _fermaFunnelSeAttivo(followupData.rowIndex); — funzione non definita causava errore
    return { success: true };
  } catch (error) { return { success: false, message: error.toString() }; }
}

// =====================================================
// FORM: STIMA CHIUSURA
// =====================================================
function mostraFormStimaChiusura() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.DATABASE);
  var selection = sheet.getActiveRange();
  if (!selection || selection.getRow() < 2) {
    SpreadsheetApp.getUi().alert('Seleziona una riga', 'Seleziona prima la riga del lead.', SpreadsheetApp.getUi().ButtonSet.OK); return;
  }
  var rowIndex = selection.getRow();
  if (sheet.getRange(rowIndex, 3).getValue() === 'Già Cliente') {
    SpreadsheetApp.getUi().alert('Già Cliente', 'Questo è già un cliente acquisito.', SpreadsheetApp.getUi().ButtonSet.OK); return;
  }
  var nomeLead = sheet.getRange(rowIndex, 2).getValue();
  var stadioAttuale = sheet.getRange(rowIndex, 6).getValue();
  var probabilitaAttuale = sheet.getRange(rowIndex, 7).getValue();
  var aumPotenziale = sheet.getRange(rowIndex, 8).getValue();
  var dataChiusura = sheet.getRange(rowIndex, 26).getValue();
  var dataFormatted = dataChiusura ? Utilities.formatDate(new Date(dataChiusura), Session.getScriptTimeZone(), 'yyyy-MM-dd') : '';
  var htmlContent = '<html><head><base target="_top"><style>' +
    '* { box-sizing: border-box; margin: 0; padding: 0; }' +
    'body { font-family: "Google Sans", Arial, sans-serif; padding: 24px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }' +
    '.form-container { background: white; padding: 28px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }' +
    '.lead-info { background: linear-gradient(135deg, #fff9c4 0%, #ffeb3b 100%); padding: 18px; border-radius: 8px; margin-bottom: 24px; border-left: 5px solid #fbc02d; }' +
    '.lead-info h3 { margin: 0 0 10px 0; color: #f57f17; font-size: 20px; }' +
    '.lead-info p { margin: 6px 0; color: #f57f17; font-size: 14px; }' +
    'h2 { color: #880e4f; margin-bottom: 24px; font-size: 20px; text-align: center; }' +
    '.form-group { margin-bottom: 20px; }' +
    'label { display: block; margin-bottom: 8px; font-weight: 600; color: #37474f; font-size: 14px; }' +
    '.required::after { content: " *"; color: #d32f2f; }' +
    'input, select { width: 100%; padding: 12px 14px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 14px; font-family: inherit; }' +
    '.preview-box { background: #e3f2fd; padding: 16px; border-radius: 6px; margin-top: 20px; border-left: 4px solid #2196f3; }' +
    '.preview-box h4 { margin: 0 0 10px 0; color: #1565c0; }' +
    '.preview-item { margin: 8px 0; color: #0d47a1; font-size: 14px; }' +
    '.button-group { display: flex; gap: 12px; margin-top: 28px; justify-content: flex-end; }' +
    'button { padding: 12px 28px; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; text-transform: uppercase; }' +
    '.btn-primary { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; }' +
    '.btn-secondary { background: white; color: #546e7a; border: 2px solid #e0e0e0; }' +
    '.message { display: none; padding: 14px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; }' +
    '.success-message { background: #e8f5e9; border-left: 4px solid #4caf50; color: #2e7d32; }' +
    '.error-message { background: #ffebee; border-left: 4px solid #f44336; color: #c62828; }' +
    '</style></head><body><div class="form-container">' +
    '<h2>💰 Aggiorna Stima Chiusura</h2>' +
    '<div class="lead-info"><h3>🎯 ' + nomeLead + '</h3><p><strong>Stadio:</strong> ' + stadioAttuale + '</p><p><strong>AUM Potenziale:</strong> €' + Number(aumPotenziale).toLocaleString('it-IT') + '</p></div>' +
    '<div id="successMessage" class="message success-message"></div><div id="errorMessage" class="message error-message"></div>' +
    '<form id="stimaForm"><input type="hidden" id="rowIndex" value="' + rowIndex + '">' +
    '<div class="form-group"><label class="required">Probabilità Chiusura (%)</label><input type="number" id="probabilita" min="0" max="100" value="' + probabilitaAttuale + '" required></div>' +
    '<div class="form-group"><label class="required">AUM Potenziale (€)</label><input type="number" id="aumPotenziale" min="0" step="1000" value="' + aumPotenziale + '" required></div>' +
    '<div class="form-group"><label class="required">Data Chiusura Prevista</label><input type="date" id="dataChiusura" value="' + dataFormatted + '" required></div>' +
    '<div class="preview-box" id="preview"><h4>📊 Preview:</h4><div class="preview-item"><strong>Revenue Prevista:</strong> <span id="previewRevenue">€0</span></div></div>' +
    '<div class="button-group"><button type="button" class="btn-secondary" onclick="google.script.host.close()">Annulla</button><button type="submit" class="btn-primary">💾 Aggiorna Stima</button></div>' +
    '</form></div>' +
    '<script>' +
    'function aggiorna() { var p=parseFloat(document.getElementById("probabilita").value)||0; var a=parseFloat(document.getElementById("aumPotenziale").value)||0; document.getElementById("previewRevenue").textContent="€"+(a*0.0045*(p/100)).toFixed(2); }' +
    'document.getElementById("probabilita").addEventListener("input",aggiorna);' +
    'document.getElementById("aumPotenziale").addEventListener("input",aggiorna);' +
    'aggiorna();' +
    'document.getElementById("stimaForm").addEventListener("submit", function(e) {' +
    '  e.preventDefault(); var btn=document.querySelector(".btn-primary"); btn.disabled=true;' +
    '  google.script.run.withSuccessHandler(function(r) {' +
    '    if(r.success){document.getElementById("successMessage").textContent="✅ Stima aggiornata!";document.getElementById("successMessage").style.display="block";setTimeout(function(){google.script.host.close();},1500);}' +
    '    else{document.getElementById("errorMessage").textContent="❌ "+r.message;document.getElementById("errorMessage").style.display="block";btn.disabled=false;}' +
    '  }).withFailureHandler(function(err){document.getElementById("errorMessage").textContent="❌ "+err.message;document.getElementById("errorMessage").style.display="block";btn.disabled=false;})' +
    '  .aggiornaStimaChiusura({rowIndex:parseInt(document.getElementById("rowIndex").value),probabilita:parseInt(document.getElementById("probabilita").value),aumPotenziale:parseFloat(document.getElementById("aumPotenziale").value),dataChiusura:document.getElementById("dataChiusura").value});' +
    '});' +
    '</script></body></html>';
  var html = HtmlService.createHtmlOutput(htmlContent).setWidth(500).setHeight(550);
  SpreadsheetApp.getUi().showModalDialog(html, '💰 Aggiorna Stima Chiusura');
}
function aggiornaStimaChiusura(stimaData) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.DATABASE);
    if (!sheet) return { success: false, message: 'Foglio DATABASE non trovato' };
    var row = stimaData.rowIndex;
    sheet.getRange(row, 7).setValue(stimaData.probabilita);
    sheet.getRange(row, 8).setValue(stimaData.aumPotenziale).setNumberFormat('€#,##0');
    sheet.getRange(row, 26).setValue(new Date(stimaData.dataChiusura)).setNumberFormat('dd/mm/yyyy');
    return { success: true };
  } catch (error) { return { success: false, message: error.toString() }; }
}

// =====================================================
// FORM: CONVERTI IN CLIENTE
// =====================================================
function mostraFormConvertiCliente() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.DATABASE);
  var selection = sheet.getActiveRange();
  if (!selection || selection.getRow() < 2) {
    SpreadsheetApp.getUi().alert('Seleziona una riga', 'Seleziona prima la riga del lead da convertire.', SpreadsheetApp.getUi().ButtonSet.OK); return;
  }
  var rowIndex = selection.getRow();
  if (sheet.getRange(rowIndex, 3).getValue() === 'Già Cliente') {
    SpreadsheetApp.getUi().alert('Già Cliente', 'Questo contatto è già un cliente.', SpreadsheetApp.getUi().ButtonSet.OK); return;
  }
  var nomeLead = sheet.getRange(rowIndex, 2).getValue();
  var aumPotenziale = sheet.getRange(rowIndex, 8).getValue();
  var htmlContent = '<html><head><base target="_top"><style>' +
    '* { box-sizing: border-box; margin: 0; padding: 0; }' +
    'body { font-family: "Google Sans", Arial, sans-serif; padding: 24px; background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }' +
    '.form-container { background: white; padding: 28px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }' +
    '.lead-info { background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%); padding: 18px; border-radius: 8px; margin-bottom: 24px; border-left: 5px solid #fdcb6e; }' +
    '.lead-info h3 { margin: 0 0 10px 0; color: #2d3436; font-size: 20px; }' +
    '.lead-info p { margin: 6px 0; color: #636e72; font-size: 14px; }' +
    'h2 { color: #00b894; margin-bottom: 24px; font-size: 20px; text-align: center; }' +
    '.form-group { margin-bottom: 20px; }' +
    'label { display: block; margin-bottom: 8px; font-weight: 600; color: #37474f; font-size: 14px; }' +
    '.required::after { content: " *"; color: #d32f2f; }' +
    'input, select { width: 100%; padding: 12px 14px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 14px; font-family: inherit; }' +
    '.fee-explanation { background: #e3f2fd; padding: 12px; border-radius: 6px; margin-top: 8px; font-size: 13px; color: #1565c0; border-left: 3px solid #42a5f5; display: none; }' +
    '.button-group { display: flex; gap: 12px; margin-top: 28px; justify-content: flex-end; }' +
    'button { padding: 12px 28px; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; text-transform: uppercase; }' +
    '.btn-primary { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; }' +
    '.btn-secondary { background: white; color: #546e7a; border: 2px solid #e0e0e0; }' +
    '.message { display: none; padding: 14px; border-radius: 6px; margin-bottom: 20px; }' +
    '.success-message { background: #e8f5e9; border-left: 4px solid #4caf50; color: #2e7d32; }' +
    '.error-message { background: #ffebee; border-left: 4px solid #f44336; color: #c62828; }' +
    '</style></head><body><div class="form-container">' +
    '<h2>🎉 Converti in Cliente</h2>' +
    '<div class="lead-info"><h3>🎯 ' + nomeLead + '</h3><p><strong>AUM Potenziale:</strong> €' + Number(aumPotenziale).toLocaleString('it-IT') + '</p></div>' +
    '<div id="successMessage" class="message success-message"></div><div id="errorMessage" class="message error-message"></div>' +
    '<form id="clienteForm"><input type="hidden" id="rowIndex" value="' + rowIndex + '">' +
    '<div class="form-group"><label class="required">Data Versamento</label><input type="date" id="dataVersamento" required></div>' +
    '<div class="form-group"><label class="required">AUM Versato (€)</label><input type="number" id="aumVersato" min="0" step="1000" required value="' + aumPotenziale + '"></div>' +
    '<div class="form-group"><label class="required">Tipo Fee</label><select id="tipoFee" required><option value="">Seleziona...</option><option value="Management Fee">Management Fee (0.45%)</option><option value="Fee Only">Fee Only (0.9%)</option><option value="IUNP 36">IUNP 36 (18%)</option></select><div id="feeExplanation" class="fee-explanation"></div></div>' +
    '<div class="form-group"><label class="required">Stato Contabilizzazione</label><select id="statoContab" required><option value="In attesa">In attesa</option><option value="Contabilizzato">Contabilizzato</option></select></div>' +
    '<div class="button-group"><button type="button" class="btn-secondary" onclick="google.script.host.close()">Annulla</button><button type="submit" class="btn-primary">✅ Converti in Cliente</button></div>' +
    '</form></div>' +
    '<script>' +
    'document.getElementById("dataVersamento").valueAsDate = new Date();' +
    'document.getElementById("tipoFee").addEventListener("change", function(){' +
    '  var exp=document.getElementById("feeExplanation"); var aum=parseFloat(document.getElementById("aumVersato").value)||0;' +
    '  if(this.value==="Management Fee"){exp.innerHTML="Guadagnerai €"+(aum*0.0045).toFixed(2)+" annui";exp.style.display="block";}' +
    '  else if(this.value==="Fee Only"){exp.innerHTML="Guadagnerai €"+(aum*0.009).toFixed(2)+" annui";exp.style.display="block";}' +
    '  else if(this.value==="IUNP 36"){exp.innerHTML="Guadagnerai €"+(aum*0.18).toFixed(2)+" una tantum";exp.style.display="block";}' +
    '  else{exp.style.display="none";}' +
    '});' +
    'document.getElementById("clienteForm").addEventListener("submit", function(e){' +
    '  e.preventDefault(); var btn=document.querySelector(".btn-primary"); btn.disabled=true;' +
    '  google.script.run.withSuccessHandler(function(r){' +
    '    if(r.success){document.getElementById("successMessage").textContent="✅ Cliente convertito!";document.getElementById("successMessage").style.display="block";setTimeout(function(){google.script.host.close();},2000);}' +
    '    else{document.getElementById("errorMessage").textContent="❌ "+r.message;document.getElementById("errorMessage").style.display="block";btn.disabled=false;}' +
    '  }).withFailureHandler(function(err){document.getElementById("errorMessage").textContent="❌ "+err.message;document.getElementById("errorMessage").style.display="block";btn.disabled=false;})' +
    '  .convertiInCliente({rowIndex:parseInt(document.getElementById("rowIndex").value),dataVersamento:document.getElementById("dataVersamento").value,aumVersato:parseFloat(document.getElementById("aumVersato").value),tipoFee:document.getElementById("tipoFee").value,statoContab:document.getElementById("statoContab").value});' +
    '});' +
    '</script></body></html>';
  var html = HtmlService.createHtmlOutput(htmlContent).setWidth(550).setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(html, '✅ Converti in Cliente');
}
function convertiInCliente(clienteData) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.DATABASE);
    if (!sheet) return { success: false, message: 'Foglio DATABASE non trovato' };
    var row = clienteData.rowIndex;
    sheet.getRange(row, 3).setValue('Già Cliente');
    sheet.getRange(row, 6).setValue('Chiusura');
    sheet.getRange(row, 7).setValue(100);
    sheet.getRange(row, 9).setValue(new Date(clienteData.dataVersamento));
    sheet.getRange(row, 10).setValue(clienteData.aumVersato);
    sheet.getRange(row, 11).setValue(clienteData.statoContab);
    sheet.getRange(row, 15).setValue(clienteData.tipoFee);
    if (clienteData.tipoFee === 'Management Fee') {
      sheet.getRange(row, 16).setFormula('=J' + row + '*0.0045');
      sheet.getRange(row, 17).setValue(''); sheet.getRange(row, 18).setValue('');
    } else if (clienteData.tipoFee === 'IUNP 36') {
      sheet.getRange(row, 16).setValue('');
      sheet.getRange(row, 17).setFormula('=J' + row + '*0.18');
      sheet.getRange(row, 18).setValue('');
    } else if (clienteData.tipoFee === 'Fee Only') {
      sheet.getRange(row, 16).setValue(''); sheet.getRange(row, 17).setValue('');
      sheet.getRange(row, 18).setFormula('=J' + row + '*0.009');
    }
    sheet.getRange(row, 9).setNumberFormat('dd/mm/yyyy');
    sheet.getRange(row, 10).setNumberFormat('€#,##0');
    sheet.getRange(row, 16, 1, 3).setNumberFormat('€#,##0.00');
    applicaFormattazioneRiga(sheet, row);
    return { success: true };
  } catch (error) { return { success: false, message: error.toString() }; }
}

// =====================================================
// FORMATTAZIONE + SETUP
// =====================================================
function applicaFormattazioneRiga(sheet, row) {
  var tipoCliente = sheet.getRange(row, 3).getValue();
  var stadio = sheet.getRange(row, 6).getValue();
  if (tipoCliente === 'Già Cliente') { sheet.getRange(row, 3).setBackground('#c6efce').setFontWeight('bold'); }
  else { sheet.getRange(row, 3).setBackground('#fff4e6').setFontWeight('bold'); }
  var coloriStadio = {'Prospect':'#fce4ec','Lead':'#e1f5fe','Primo Contatto':'#fff9c4','Appuntamento':'#f0f4c3','Secondo Appuntamento':'#dcedc8','Chiusura':'#c8e6c9'};
  if (coloriStadio[stadio]) { sheet.getRange(row, 6).setBackground(coloriStadio[stadio]); }
  sheet.getRange(row, 1, 1, 26).setBorder(true, true, true, true, false, false, '#bdbdbd', SpreadsheetApp.BorderStyle.SOLID);
}
function applicaFormattazioneCompleta() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.DATABASE);
  if (!sheet) { SpreadsheetApp.getUi().alert('Foglio DATABASE non trovato'); return; }
  try {
    var lastRow = sheet.getLastRow();
    sheet.getRange(1, 1, 1, 26).setBackground('#1a237e').setFontColor('#ffffff').setFontWeight('bold').setFontSize(11).setHorizontalAlignment('center').setVerticalAlignment('middle');
    for (var i = 2; i <= lastRow; i++) {
      var val = sheet.getRange(i, 1).getValue();
      if (val && val !== 'TOTALI') { applicaFormattazioneRiga(sheet, i); }
    }
    for (var j = 2; j <= lastRow; j++) {
      if (sheet.getRange(j, 1).getValue() === 'TOTALI') {
        sheet.getRange(j, 1, 1, 26).setBackground('#ffc107').setFontWeight('bold').setFontSize(12); break;
      }
    }
    sheet.setFrozenRows(1); sheet.setFrozenColumns(1);
    SpreadsheetApp.getUi().alert('✅ Formattazione Applicata', 'La veste grafica è stata applicata con successo!', SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (error) { SpreadsheetApp.getUi().alert('Errore: ' + error.toString()); }
}
function setupIniziale() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.DATABASE);
  if (!sheet) { SpreadsheetApp.getUi().alert('Errore: Foglio DATABASE non trovato'); return; }
  try {
    var lastRow = sheet.getLastRow();
    var totaliRow = lastRow;
    if (lastRow > 1) {
      var valoriColonnaA = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < valoriColonnaA.length; i++) {
        if (valoriColonnaA[i][0] === 'TOTALI') { totaliRow = i + 2; break; }
      }
    }
    var dataRows = totaliRow - 2;
    if (dataRows < 1) { SpreadsheetApp.getUi().alert('Nessun dato da configurare'); return; }
    var ruleTipo = SpreadsheetApp.newDataValidation().requireValueInList(CONFIG.TIPO_CLIENTE, true).setAllowInvalid(false).build();
    sheet.getRange(2, 3, dataRows, 1).setDataValidation(ruleTipo);
    var ruleFonte = SpreadsheetApp.newDataValidation().requireValueInList(CONFIG.FONTI_LEAD, true).setAllowInvalid(false).build();
    sheet.getRange(2, 4, dataRows, 1).setDataValidation(ruleFonte);
    var ruleStadio = SpreadsheetApp.newDataValidation().requireValueInList(CONFIG.STADI_PIPELINE, true).setAllowInvalid(false).build();
    sheet.getRange(2, 6, dataRows, 1).setDataValidation(ruleStadio);
    var ruleContatto = SpreadsheetApp.newDataValidation().requireValueInList(CONFIG.TIPO_CONTATTO, true).setAllowInvalid(true).build();
    sheet.getRange(2, 12, dataRows, 1).setDataValidation(ruleContatto);
    var ruleFee = SpreadsheetApp.newDataValidation().requireValueInList(CONFIG.TIPO_FEE, true).setAllowInvalid(true).build();
    sheet.getRange(2, 15, dataRows, 1).setDataValidation(ruleFee);
    var ruleCluster = SpreadsheetApp.newDataValidation().requireValueInList(CONFIG.CLUSTER_CLIENTE, true).setAllowInvalid(false).build();
    sheet.getRange(2, 20, dataRows, 1).setDataValidation(ruleCluster);
    var ruleProb = SpreadsheetApp.newDataValidation().requireNumberBetween(0, 100).setAllowInvalid(false).build();
    sheet.getRange(2, 7, dataRows, 1).setDataValidation(ruleProb);
    sheet.getRange(2, 16, dataRows, 3).protect().setDescription('Revenue - NON modificare').setWarningOnly(true);
    sheet.getRange(2, 21, dataRows, 2).protect().setDescription('Formule automatiche - NON modificare').setWarningOnly(true);
    sheet.getRange(2, 25, dataRows, 1).protect().setDescription('Revenue Prevista - NON modificare').setWarningOnly(true);
    applicaFormattazioneCompleta();
    SpreadsheetApp.getUi().alert('✅ Setup v3.0 Completato', 'Configurazioni applicate:\n\n✓ Dropdown validati\n✓ Celle formule protette\n✓ Formattazione grafica applicata\n\nSistema pronto!', SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (error) { SpreadsheetApp.getUi().alert('Errore: ' + error.toString()); }
}

// =====================================================
// GUIDA RAPIDA
// =====================================================
function mostraGuida() {
  var html = '<html><head><base target="_top"><style>' +
    'body { font-family: "Google Sans", Arial, sans-serif; padding: 24px; line-height: 1.8; color: #37474f; }' +
    'h2 { color: #1a237e; border-bottom: 3px solid #667eea; padding-bottom: 12px; }' +
    'h3 { color: #00838f; margin-top: 24px; }' +
    '.feature { background: #f5f5f5; padding: 16px; border-left: 4px solid #667eea; margin: 16px 0; border-radius: 4px; }' +
    'ul { margin: 12px 0; padding-left: 28px; } li { margin: 8px 0; }' +
    '</style></head><body>' +
    '<h2>📊 Private Banker CRM v3.0 - Guida Rapida</h2>' +
    '<div class="feature"><h3>➕ Nuovo Lead Potenziale</h3><p>Aggiungi lead da qualsiasi fonte. Revenue Prevista e Data Chiusura calcolate automaticamente.</p></div>' +
    '<div class="feature"><h3>📞 Registra Follow-up</h3><p>Traccia ogni interazione. Giorni Silenzio si resetta a 0. Pianifica prossimo follow-up.</p></div>' +
    '<div class="feature"><h3>💰 Stima Chiusura</h3><p>Aggiorna previsioni con preview Revenue in tempo reale.</p></div>' +
    '<div class="feature"><h3>✅ Converti in Cliente</h3><p>Inserisci AUM versato, tipo fee. Revenue calcolate automaticamente.</p></div>' +
    '<div class="feature"><h3>🎯 Sistema Anti-Perdita</h3><p>🔴 URGENTE: 2° App >7gg | 🟡 FOLLOW-UP: App >14gg | 🟠 RIATTIVA: 1° Contatto >30gg | ⚫ PERSO?: >60gg</p></div>' +
    '<div class="feature"><h3>📊 Dashboard & Report</h3><p>Revenue, Cash Flow 12 mesi, Kanban Pipeline, Analisi Conversione. Aggiorna tutto dal menu.</p></div>' +
    '<div class="feature"><h3>⏰ Alert Giornalieri</h3><p>Email automatica ogni mattina con lead urgenti e follow-up scaduti. Configura da menu.</p></div>' +
    '<p style="margin-top:32px;text-align:center;color:#78909c;"><strong>Versione 3.0 Completa</strong> - 2026</p>' +
    '</body></html>';
  var htmlOutput = HtmlService.createHtmlOutput(html).setWidth(650).setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'ℹ️ Guida Rapida v3.0');
}

// =====================================================
// DASHBOARD REVENUE
// =====================================================
function aggiornaDashboardRevenue() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dbSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.DATABASE);
  var dashSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.DASHBOARD);
  if (!dbSheet) { SpreadsheetApp.getUi().alert('❌ Foglio DATABASE non trovato'); return; }
  if (!dashSheet) { dashSheet = ss.insertSheet(CONFIG.SHEET_NAMES.DASHBOARD); }
  dashSheet.clear(); dashSheet.clearFormats();
  var lastRow = _getLastDataRow(dbSheet);
  if (lastRow < 2) { dashSheet.getRange('A1').setValue('⚠️ Nessun dato nel DATABASE'); return; }
  var data = dbSheet.getRange(2, 1, lastRow - 1, 19).getValues();
  var totalClienti = 0, totalPotenziali = 0, aumClienti = 0, aumPipeline = 0;
  var revenueMgmt = 0, revenueIUNP = 0, revenuePipelinePonderata = 0;
  var clusterBreakdown = {}, fonteBreakdown = {}, stadioBreakdown = {};
  data.forEach(function(row) {
    var id = row[0]; if (!id || id === 'TOTALI' || id === '') return;
    var tipoCliente = row[2], fonte = row[3], stadio = row[5], probabilita = row[6];
    var aumPotenziale = row[7], aumVersato = row[9], cluster = row[15];
    var mgmtFee = row[17], iunpFee = row[18];
    if (tipoCliente === 'Già Cliente') {
      totalClienti++; aumClienti += (typeof aumVersato === 'number' ? aumVersato : 0);
      revenueMgmt += (typeof mgmtFee === 'number' ? mgmtFee : 0);
      revenueIUNP += (typeof iunpFee === 'number' ? iunpFee : 0);
    } else {
      totalPotenziali++;
      var aumPot = typeof aumPotenziale === 'number' ? aumPotenziale : 0;
      var prob = typeof probabilita === 'number' ? probabilita : 0;
      aumPipeline += aumPot; revenuePipelinePonderata += aumPot * 0.0045 * (prob / 100);
    }
    if (cluster) {
      if (!clusterBreakdown[cluster]) clusterBreakdown[cluster] = { clienti:0, potenziali:0, aum:0 };
      if (tipoCliente === 'Già Cliente') { clusterBreakdown[cluster].clienti++; clusterBreakdown[cluster].aum += (typeof aumVersato === 'number' ? aumVersato : 0); }
      else { clusterBreakdown[cluster].potenziali++; }
    }
    if (fonte) {
      if (!fonteBreakdown[fonte]) fonteBreakdown[fonte] = { totale:0, chiusi:0, aumChiusi:0 };
      fonteBreakdown[fonte].totale++;
      if (tipoCliente === 'Già Cliente') { fonteBreakdown[fonte].chiusi++; fonteBreakdown[fonte].aumChiusi += (typeof aumVersato === 'number' ? aumVersato : 0); }
    }
    if (stadio && tipoCliente !== 'Già Cliente') {
      if (!stadioBreakdown[stadio]) stadioBreakdown[stadio] = { count:0, aum:0 };
      stadioBreakdown[stadio].count++; stadioBreakdown[stadio].aum += (typeof aumPotenziale === 'number' ? aumPotenziale : 0);
    }
  });
  var revenueClientiTotale = revenueMgmt + revenueIUNP;
  dashSheet.getRange('A1').setValue('💰 DASHBOARD REVENUE - Private Banker CRM v3.0');
  dashSheet.getRange('A1:H1').merge().setBackground('#1a237e').setFontColor('#fff').setFontSize(16).setFontWeight('bold').setHorizontalAlignment('center');
  dashSheet.getRange('A2').setValue('Aggiornato: ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm'));
  dashSheet.getRange('A2:H2').merge().setBackground('#283593').setFontColor('#90caf9').setFontSize(10).setHorizontalAlignment('center');
  var kpiTitles = ['👥 CLIENTI','🎯 PIPELINE','💰 AUM GESTITO','📊 AUM PIPELINE','💵 REV. CLIENTI','🔮 REV. PIPELINE','📈 REV. TOTALE','🎯 TARGET 15M€'];
  var kpiValues = [totalClienti, totalPotenziali, '€'+_formatNumber(aumClienti), '€'+_formatNumber(aumPipeline), '€'+_formatNumber(revenueClientiTotale), '€'+_formatNumber(revenuePipelinePonderata), '€'+_formatNumber(revenueClientiTotale+revenuePipelinePonderata), _formatPercentage(aumClienti/15000000*100)+'%'];
  for (var c = 0; c < 8; c++) {
    dashSheet.getRange(4, c+1).setValue(kpiTitles[c]).setBackground('#e8eaf6').setFontWeight('bold').setFontSize(9).setHorizontalAlignment('center');
    dashSheet.getRange(5, c+1).setValue(kpiValues[c]).setBackground('#c5cae9').setFontWeight('bold').setFontSize(14).setHorizontalAlignment('center').setFontColor('#1a237e');
  }
  var r = 8;
  dashSheet.getRange(r,1).setValue('💵 REVENUE PER TIPO FEE');
  dashSheet.getRange(r,1,1,4).merge().setBackground('#1b5e20').setFontColor('#fff').setFontSize(13).setFontWeight('bold');
  r++;
  dashSheet.getRange(r,1,1,4).setValues([['Tipo Fee','Revenue Annua','% Totale','Note']]).setBackground('#2e7d32').setFontColor('#fff').setFontWeight('bold').setHorizontalAlignment('center');
  r++;
  var feeData = [['Management Fee (0.45%)',revenueMgmt,revenueClientiTotale>0?revenueMgmt/revenueClientiTotale*100:0,'Ricorrente'],['IUNP 36 (18%)',revenueIUNP,revenueClientiTotale>0?revenueIUNP/revenueClientiTotale*100:0,'Una tantum'],['TOTALE',revenueClientiTotale,100,'']];
  feeData.forEach(function(fr, i) {
    dashSheet.getRange(r+i,1).setValue(fr[0]); dashSheet.getRange(r+i,2).setValue(fr[1]).setNumberFormat('€#,##0.00');
    dashSheet.getRange(r+i,3).setValue(fr[2]).setNumberFormat('0.0"%"'); dashSheet.getRange(r+i,4).setValue(fr[3]);
    if (i === feeData.length-1) dashSheet.getRange(r+i,1,1,4).setBackground('#e8f5e9').setFontWeight('bold');
  });
  r += feeData.length + 2;
  dashSheet.getRange(r,1).setValue('👥 BREAKDOWN PER CLUSTER');
  dashSheet.getRange(r,1,1,5).merge().setBackground('#e65100').setFontColor('#fff').setFontSize(13).setFontWeight('bold');
  r++;
  dashSheet.getRange(r,1,1,5).setValues([['Cluster','Clienti','Potenziali','AUM Gestito','% AUM']]).setBackground('#ef6c00').setFontColor('#fff').setFontWeight('bold').setHorizontalAlignment('center');
  r++;
  Object.keys(clusterBreakdown).sort().forEach(function(cl, i) {
    var cb = clusterBreakdown[cl];
    dashSheet.getRange(r+i,1).setValue(cl); dashSheet.getRange(r+i,2).setValue(cb.clienti).setHorizontalAlignment('center');
    dashSheet.getRange(r+i,3).setValue(cb.potenziali).setHorizontalAlignment('center');
    dashSheet.getRange(r+i,4).setValue(cb.aum).setNumberFormat('€#,##0');
    dashSheet.getRange(r+i,5).setValue(aumClienti>0?cb.aum/aumClienti*100:0).setNumberFormat('0.0"%"');
    if (i%2===0) dashSheet.getRange(r+i,1,1,5).setBackground('#fff3e0');
  });
  r += Object.keys(clusterBreakdown).length + 2;
  dashSheet.getRange(r,1).setValue('📣 PERFORMANCE PER FONTE LEAD');
  dashSheet.getRange(r,1,1,5).merge().setBackground('#4a148c').setFontColor('#fff').setFontSize(13).setFontWeight('bold');
  r++;
  dashSheet.getRange(r,1,1,5).setValues([['Fonte','Lead Totali','Chiusi','Tasso Conv.','AUM Chiusi']]).setBackground('#6a1b9a').setFontColor('#fff').setFontWeight('bold').setHorizontalAlignment('center');
  r++;
  Object.keys(fonteBreakdown).sort().forEach(function(f, i) {
    var fb = fonteBreakdown[f];
    dashSheet.getRange(r+i,1).setValue(f); dashSheet.getRange(r+i,2).setValue(fb.totale).setHorizontalAlignment('center');
    dashSheet.getRange(r+i,3).setValue(fb.chiusi).setHorizontalAlignment('center');
    dashSheet.getRange(r+i,4).setValue(fb.totale>0?fb.chiusi/fb.totale*100:0).setNumberFormat('0.0"%"');
    dashSheet.getRange(r+i,5).setValue(fb.aumChiusi).setNumberFormat('€#,##0');
    if (i%2===0) dashSheet.getRange(r+i,1,1,5).setBackground('#f3e5f5');
  });
  r += Object.keys(fonteBreakdown).length + 2;
  dashSheet.getRange(r,1).setValue('🎯 PIPELINE PER STADIO');
  dashSheet.getRange(r,1,1,4).merge().setBackground('#0d47a1').setFontColor('#fff').setFontSize(13).setFontWeight('bold');
  r++;
  dashSheet.getRange(r,1,1,4).setValues([['Stadio','N° Lead','AUM Pipeline','% Pipeline']]).setBackground('#1565c0').setFontColor('#fff').setFontWeight('bold').setHorizontalAlignment('center');
  r++;
  var stadiOrdinati = CONFIG.STADI_PIPELINE.filter(function(s){return s!=='Chiusura';});
  stadiOrdinati.forEach(function(st, i) {
    var sb = stadioBreakdown[st] || {count:0, aum:0};
    dashSheet.getRange(r+i,1).setValue(st); dashSheet.getRange(r+i,2).setValue(sb.count).setHorizontalAlignment('center');
    dashSheet.getRange(r+i,3).setValue(sb.aum).setNumberFormat('€#,##0');
    dashSheet.getRange(r+i,4).setValue(aumPipeline>0?sb.aum/aumPipeline*100:0).setNumberFormat('0.0"%"');
    var colSt={'Prospect':'#fce4ec','Lead':'#e1f5fe','Primo Contatto':'#fff9c4','Appuntamento':'#f0f4c3','Secondo Appuntamento':'#dcedc8'};
    dashSheet.getRange(r+i,1,1,4).setBackground(colSt[st]||'#f5f5f5');
  });
  for (var cc=1;cc<=8;cc++) { dashSheet.autoResizeColumn(cc); }
  dashSheet.setFrozenRows(2); SpreadsheetApp.flush();
}

// =====================================================
// CASH FLOW
// =====================================================
function aggiornaCashFlow() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dbSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.DATABASE);
  var cfSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.CASHFLOW);
  if (!dbSheet) { SpreadsheetApp.getUi().alert('❌ Foglio DATABASE non trovato'); return; }
  if (!cfSheet) { cfSheet = ss.insertSheet(CONFIG.SHEET_NAMES.CASHFLOW); }
  cfSheet.clear(); cfSheet.clearFormats();
  var lastRow = _getLastDataRow(dbSheet);
  if (lastRow < 2) { cfSheet.getRange('A1').setValue('⚠️ Nessun dato nel DATABASE'); return; }
  var data = dbSheet.getRange(2, 1, lastRow - 1, 19).getValues();
  var oggi = new Date();
  var mesi = [];
  for (var m = 0; m < 12; m++) {
    var d = new Date(oggi.getFullYear(), oggi.getMonth() + m, 1);
    mesi.push({key:Utilities.formatDate(d,Session.getScriptTimeZone(),'yyyy-MM'),label:Utilities.formatDate(d,Session.getScriptTimeZone(),'MMM yyyy'),revenueCerta:0,revenueProbabile:0,revenueBestCase:0,leadPrevisti:0,dettagliLead:[]});
  }
  var revenueRicorrenteMensile = 0;
  data.forEach(function(row) {
    var id = row[0]; if (!id || id === 'TOTALI' || id === '') return;
    var tipoCliente = row[2], stadio = row[5], probabilita = row[6], aumPotenziale = row[7];
    var dataUltimoContatto = row[12], mgmtFee = row[17];
    if (tipoCliente === 'Già Cliente') {
      var mgmt = typeof mgmtFee === 'number' ? mgmtFee : 0;
      revenueRicorrenteMensile += mgmt / 12; return;
    }
    var prob = typeof probabilita === 'number' ? probabilita : 0;
    var aum = typeof aumPotenziale === 'number' ? aumPotenziale : 0;
    if (aum <= 0 || prob <= 0) return;
    var giorniAllaChiusura = CONFIG.GIORNI_CHIUSURA[stadio] || 60;
    var dataRiferimento = oggi;
    if (dataUltimoContatto instanceof Date) { dataRiferimento = dataUltimoContatto; }
    var dataChiusuraStimata = new Date(dataRiferimento.getTime() + (giorniAllaChiusura * 24 * 60 * 60 * 1000));
    if (dataChiusuraStimata < oggi) { dataChiusuraStimata = new Date(oggi.getFullYear(), oggi.getMonth(), 15); }
    var meseChiusura = Utilities.formatDate(dataChiusuraStimata, Session.getScriptTimeZone(), 'yyyy-MM');
    var revenueAnnua = aum * 0.0045;
    for (var m2 = 0; m2 < mesi.length; m2++) {
      if (mesi[m2].key === meseChiusura) {
        mesi[m2].revenueProbabile += revenueAnnua * (prob / 100);
        mesi[m2].revenueBestCase += revenueAnnua; mesi[m2].leadPrevisti++;
        mesi[m2].dettagliLead.push(row[1] + ' (' + prob + '% — €' + _formatNumber(aum) + ' — ' + stadio + ')');
        break;
      }
    }
  });
  mesi.forEach(function(m3) { m3.revenueCerta = revenueRicorrenteMensile; });
  cfSheet.getRange('A1').setValue('💵 PREVISIONI CASH FLOW — Prossimi 12 Mesi');
  cfSheet.getRange('A1:H1').merge().setBackground('#1a237e').setFontColor('#fff').setFontSize(16).setFontWeight('bold').setHorizontalAlignment('center');
  var infoText = 'Revenue ricorrente clienti: €'+_formatNumber(revenueRicorrenteMensile*12)+'/anno (€'+_formatNumber(revenueRicorrenteMensile)+'/mese)  |  Chiusure stimate in base allo stadio pipeline  |  Aggiornato: '+Utilities.formatDate(oggi,Session.getScriptTimeZone(),'dd/MM/yyyy HH:mm');
  cfSheet.getRange('A2').setValue(infoText);
  cfSheet.getRange('A2:H2').merge().setBackground('#283593').setFontColor('#90caf9').setFontSize(10).setHorizontalAlignment('center');
  cfSheet.getRange('A3').setValue('💰 Certa = revenue da clienti acquisiti  |  🎯 Probabile = pipeline × probabilità  |  🚀 Best Case = se chiudono tutti al 100%');
  cfSheet.getRange('A3:H3').merge().setBackground('#e8eaf6').setFontColor('#1a237e').setFontSize(10).setHorizontalAlignment('center');
  var r = 5;
  cfSheet.getRange(r,1,1,8).setValues([['Mese','💰 Certa','🎯 Probabile','🚀 Best Case','📊 TOTALE MESE','🤝 Chiusure','📈 Cumulativo','Dettaglio Lead']]).setBackground('#0d47a1').setFontColor('#fff').setFontWeight('bold').setHorizontalAlignment('center').setWrap(true);
  cfSheet.setRowHeight(r, 40);
  r++;
  var cumulativo = 0;
  mesi.forEach(function(m4, i) {
    var totaleMese = m4.revenueCerta + m4.revenueProbabile; cumulativo += totaleMese;
    cfSheet.getRange(r+i,1).setValue(m4.label).setFontWeight('bold');
    cfSheet.getRange(r+i,2).setValue(m4.revenueCerta).setNumberFormat('€#,##0.00');
    cfSheet.getRange(r+i,3).setValue(m4.revenueProbabile).setNumberFormat('€#,##0.00');
    cfSheet.getRange(r+i,4).setValue(m4.revenueBestCase).setNumberFormat('€#,##0.00');
    cfSheet.getRange(r+i,5).setValue(totaleMese).setNumberFormat('€#,##0.00').setFontWeight('bold');
    cfSheet.getRange(r+i,6).setValue(m4.leadPrevisti).setHorizontalAlignment('center');
    cfSheet.getRange(r+i,7).setValue(cumulativo).setNumberFormat('€#,##0.00');
    cfSheet.getRange(r+i,8).setValue(m4.dettagliLead.join('\n')).setWrap(true).setFontSize(9);
    var bgColor;
    if (m4.leadPrevisti > 0) bgColor = (i%2===0?'#e8f5e9':'#c8e6c9');
    else bgColor = (i%2===0?'#ffffff':'#f5f5f5');
    cfSheet.getRange(r+i,1,1,8).setBackground(bgColor);
    if (m4.revenueProbabile > 0) { cfSheet.getRange(r+i,3).setFontColor('#2e7d32').setFontWeight('bold'); }
  });
  var totRow = r + mesi.length;
  cfSheet.getRange(totRow,1).setValue('TOTALE 12 MESI').setFontWeight('bold').setFontSize(12);
  cfSheet.getRange(totRow,2).setFormula('=SUM(B'+r+':B'+(totRow-1)+')').setNumberFormat('€#,##0.00');
  cfSheet.getRange(totRow,3).setFormula('=SUM(C'+r+':C'+(totRow-1)+')').setNumberFormat('€#,##0.00');
  cfSheet.getRange(totRow,4).setFormula('=SUM(D'+r+':D'+(totRow-1)+')').setNumberFormat('€#,##0.00');
  cfSheet.getRange(totRow,5).setFormula('=SUM(E'+r+':E'+(totRow-1)+')').setNumberFormat('€#,##0.00');
  cfSheet.getRange(totRow,6).setFormula('=SUM(F'+r+':F'+(totRow-1)+')');
  cfSheet.getRange(totRow,1,1,8).setBackground('#ffc107').setFontWeight('bold').setFontSize(12);
  for (var cc=1;cc<=8;cc++) { cfSheet.autoResizeColumn(cc); }
  cfSheet.setColumnWidth(8,350); cfSheet.setFrozenRows(5); SpreadsheetApp.flush();
}
function aggiornaDashboard() {
  try {
    aggiornaDashboardRevenue(); aggiornaCashFlow();
    SpreadsheetApp.getUi().alert('✅ Dashboard Aggiornati', 'Revenue + Cash Flow aggiornati con successo!', SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (error) { SpreadsheetApp.getUi().alert('❌ Errore: ' + error.toString()); }
}

// =====================================================
// MODULO 2: TRIGGER + EMAIL ALERT
// =====================================================
function installaTriggerGiornaliero() {
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(t) { if (t.getHandlerFunction() === 'eseguiControlloGiornaliero') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('eseguiControlloGiornaliero').timeBased().everyDays(1).atHour(8).create();
  SpreadsheetApp.getUi().alert('✅ Trigger Installato', 'Alert giornaliero alle 8:00 a ' + CONFIG.EMAIL_NOTIFICHE, SpreadsheetApp.getUi().ButtonSet.OK);
}
function rimuoviTriggerGiornaliero() {
  var triggers = ScriptApp.getProjectTriggers();
  var rimossi = 0;
  triggers.forEach(function(t) { if (t.getHandlerFunction() === 'eseguiControlloGiornaliero') { ScriptApp.deleteTrigger(t); rimossi++; } });
  SpreadsheetApp.getUi().alert('Trigger rimossi: ' + rimossi);
}

// FIX BUG 1: rimossa chiamata a processaFunnelAutomatico() (funzione non definita) dal forEach
// FIX BUG 2: aggiunta variabile oggetto prima di MailApp.sendEmail
function eseguiControlloGiornaliero() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dbSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.DATABASE);
  if (!dbSheet) return;
  var lastRow = _getLastDataRow(dbSheet);
  if (lastRow < 2) return;
  var data = dbSheet.getRange(2, 1, lastRow - 1, 26).getValues();
  var oggi = new Date();
  var urgenti = [], followup = [], riattiva = [], persi = [], followupOggi = [], followupScaduti = [];
  var totalPotenziali = 0, totalClienti = 0, aumPipeline = 0;
  data.forEach(function(row) {
    var id = row[0]; if (!id || id === 'TOTALI' || id === '') return;
    var nome = row[1], tipoCliente = row[2], stadio = row[5], probabilita = row[6];
    var aumPotenziale = row[7], dataUltimoContatto = row[12], prossimoFollowup = row[22], noteFollowup = row[23];
    if (tipoCliente === 'Già Cliente') { totalClienti++; return; }
    totalPotenziali++;
    aumPipeline += (typeof aumPotenziale === 'number' ? aumPotenziale : 0);
    var giorniSilenzio = 0;
    if (dataUltimoContatto instanceof Date) giorniSilenzio = Math.floor((oggi - dataUltimoContatto) / (24 * 60 * 60 * 1000));
    var leadInfo = { nome:nome, stadio:stadio, probabilita:probabilita, aum:typeof aumPotenziale==='number'?aumPotenziale:0, giorniSilenzio:giorniSilenzio, noteFollowup:noteFollowup||'-' };
    if (stadio === 'Secondo Appuntamento' && giorniSilenzio > 7) urgenti.push(leadInfo);
    else if (stadio === 'Appuntamento' && giorniSilenzio > 14) followup.push(leadInfo);
    else if (stadio === 'Primo Contatto' && giorniSilenzio > 30) riattiva.push(leadInfo);
    else if (giorniSilenzio > 60) persi.push(leadInfo);
    if (prossimoFollowup instanceof Date) {
      var diffGiorni = Math.floor((prossimoFollowup - oggi) / (24 * 60 * 60 * 1000));
      if (diffGiorni === 0) followupOggi.push(leadInfo);
      else if (diffGiorni < 0) { leadInfo.giorniScaduto = Math.abs(diffGiorni); followupScaduti.push(leadInfo); }
      // RIMOSSO: processaFunnelAutomatico(); — funzione non definita causava ReferenceError
    }
  });
  var totaleAlert = urgenti.length + followup.length + riattiva.length + persi.length + followupOggi.length + followupScaduti.length;
  if (totaleAlert === 0) return;
  var emailBody = _costruisciEmailAlert({ urgenti:urgenti, followup:followup, riattiva:riattiva, persi:persi, followupOggi:followupOggi, followupScaduti:followupScaduti, totalPotenziali:totalPotenziali, totalClienti:totalClienti, aumPipeline:aumPipeline, oggi:oggi });
  // FIX BUG 2: variabile oggetto ora correttamente definita
  var oggetto = '🚨 CRM Alert: ' + totaleAlert + ' azioni — ' + Utilities.formatDate(oggi, Session.getScriptTimeZone(), 'dd/MM/yyyy');
  MailApp.sendEmail({to:CONFIG.EMAIL_NOTIFICHE, subject:oggetto, htmlBody:emailBody, name:'Antonio Tritto'});
}
function _costruisciEmailAlert(ad) {
  var html = '<div style="font-family:Segoe UI,Arial,sans-serif;max-width:700px;margin:0 auto;">' +
    '<div style="background:linear-gradient(135deg,#1a237e,#4a148c);padding:24px;border-radius:12px 12px 0 0;">' +
    '<h1 style="color:white;margin:0;font-size:24px;">🚨 CRM Daily Alert</h1>' +
    '<p style="color:#b39ddb;margin:8px 0 0;">' + Utilities.formatDate(ad.oggi, Session.getScriptTimeZone(), 'dd MMMM yyyy') + '</p></div>' +
    '<div style="background:#f5f5f5;padding:20px;">' +
    '<table style="width:100%;margin-bottom:20px;"><tr>' +
    '<td style="background:white;padding:16px;border-radius:8px;text-align:center;"><div style="font-size:28px;font-weight:bold;color:#1a237e;">' + ad.totalClienti + '</div><div style="font-size:12px;color:#78909c;">Clienti</div></td>' +
    '<td style="width:16px;"></td>' +
    '<td style="background:white;padding:16px;border-radius:8px;text-align:center;"><div style="font-size:28px;font-weight:bold;color:#e65100;">' + ad.totalPotenziali + '</div><div style="font-size:12px;color:#78909c;">Pipeline</div></td>' +
    '<td style="width:16px;"></td>' +
    '<td style="background:white;padding:16px;border-radius:8px;text-align:center;"><div style="font-size:28px;font-weight:bold;color:#2e7d32;">€' + _formatNumber(ad.aumPipeline) + '</div><div style="font-size:12px;color:#78909c;">AUM Pipeline</div></td>' +
    '</tr></table>';
  if (ad.followupScaduti.length > 0) html += _emailSection('⏰ FOLLOW-UP SCADUTI', '#d32f2f', ad.followupScaduti, function(l) { return '<strong>'+l.nome+'</strong> — Scaduto da '+l.giorniScaduto+'gg | '+l.stadio; });
  if (ad.followupOggi.length > 0) html += _emailSection('📅 FOLLOW-UP DI OGGI', '#1565c0', ad.followupOggi, function(l) { return '<strong>'+l.nome+'</strong> — '+l.stadio+' ('+l.probabilita+'%) | '+l.noteFollowup; });
  if (ad.urgenti.length > 0) html += _emailSection('🔴 URGENTI', '#c62828', ad.urgenti, function(l) { return '<strong>'+l.nome+'</strong> — '+l.giorniSilenzio+'gg silenzio | €'+_formatNumber(l.aum); });
  if (ad.followup.length > 0) html += _emailSection('🟡 FOLLOW-UP', '#f57f17', ad.followup, function(l) { return '<strong>'+l.nome+'</strong> — '+l.giorniSilenzio+'gg silenzio | €'+_formatNumber(l.aum); });
  if (ad.riattiva.length > 0) html += _emailSection('🟠 DA RIATTIVARE', '#e65100', ad.riattiva, function(l) { return '<strong>'+l.nome+'</strong> — '+l.giorniSilenzio+'gg silenzio | €'+_formatNumber(l.aum); });
  if (ad.persi.length > 0) html += _emailSection('⚫ POTENZIALMENTE PERSI', '#37474f', ad.persi, function(l) { return '<strong>'+l.nome+'</strong> — '+l.giorniSilenzio+'gg | '+l.stadio; });
  html += '</div><div style="background:#1a237e;padding:16px;text-align:center;border-radius:0 0 12px 12px;"><p style="color:#b39ddb;margin:0;font-size:12px;">CRM v3.0 | Antonio Tritto</p></div></div>';
  return html;
}
function _emailSection(titolo, colore, items, renderFn) {
  var html = '<div style="background:white;border-radius:8px;margin-bottom:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">' +
    '<div style="background:' + colore + ';padding:12px 20px;"><h3 style="color:white;margin:0;font-size:15px;">' + titolo + ' (' + items.length + ')</h3></div><div style="padding:16px;">';
  items.forEach(function(item) { html += '<div style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#37474f;">' + renderFn(item) + '</div>'; });
  html += '</div></div>';
  return html;
}
function testAlertEmail() {
  eseguiControlloGiornaliero();
  SpreadsheetApp.getUi().alert('📧 Email inviata a ' + CONFIG.EMAIL_NOTIFICHE);
}

// =====================================================
// MODULO 3: KANBAN + ANALISI CONVERSIONE
// =====================================================
function aggiornaKanban() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dbSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.DATABASE);
  var kanbanSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.KANBAN);
  if (!dbSheet) { SpreadsheetApp.getUi().alert('❌ Foglio DATABASE non trovato'); return; }
  if (!kanbanSheet) { kanbanSheet = ss.insertSheet(CONFIG.SHEET_NAMES.KANBAN); }
  kanbanSheet.clear(); kanbanSheet.clearFormats();
  var lastRow = _getLastDataRow(dbSheet);
  if (lastRow < 2) return;
  var data = dbSheet.getRange(2, 1, lastRow - 1, 26).getValues();
  var oggi = new Date();
  var kanban = {};
  CONFIG.STADI_PIPELINE.forEach(function(s) { kanban[s] = []; });
  data.forEach(function(row) {
    var id = row[0]; if (!id || id === 'TOTALI' || id === '') return;
    if (row[2] === 'Già Cliente') return;
    var stadio = row[5], dataUC = row[12];
    var giorniSilenzio = 0;
    if (dataUC instanceof Date) giorniSilenzio = Math.floor((oggi - dataUC) / (24 * 60 * 60 * 1000));
    var followupStr = '-';
    if (row[22] instanceof Date) followupStr = Utilities.formatDate(row[22], Session.getScriptTimeZone(), 'dd/MM');
    if (kanban[stadio]) {
      kanban[stadio].push({nome:row[1], probabilita:row[6], aum:typeof row[7]==='number'?row[7]:0, giorniSilenzio:giorniSilenzio, followup:followupStr, noteFollowup:row[23]||'', cluster:row[19]||'-'});
    }
  });
  Object.keys(kanban).forEach(function(s) { kanban[s].sort(function(a,b){return b.giorniSilenzio-a.giorniSilenzio;}); });
  kanbanSheet.getRange('A1').setValue('🎯 KANBAN PIPELINE - Vista Operativa');
  kanbanSheet.getRange('A1:L1').merge().setBackground('#1a237e').setFontColor('#fff').setFontSize(16).setFontWeight('bold').setHorizontalAlignment('center');
  var col = 1;
  var coloriH = {'Prospect':'#e91e63','Lead':'#2196f3','Primo Contatto':'#ff9800','Appuntamento':'#4caf50','Secondo Appuntamento':'#009688','Chiusura':'#8bc34a'};
  CONFIG.STADI_PIPELINE.forEach(function(stadio) {
    var count = kanban[stadio] ? kanban[stadio].length : 0;
    kanbanSheet.getRange(3,col,1,2).merge().setValue(stadio+' ('+count+')').setBackground(coloriH[stadio]||'#607d8b').setFontColor('#fff').setFontWeight('bold').setFontSize(12).setHorizontalAlignment('center');
    kanbanSheet.getRange(4,col).setValue('Lead').setBackground('#eceff1').setFontWeight('bold').setFontSize(9);
    kanbanSheet.getRange(4,col+1).setValue('Info').setBackground('#eceff1').setFontWeight('bold').setFontSize(9);
    if (kanban[stadio]) {
      kanban[stadio].forEach(function(lead, i) {
        var r2 = 5 + i;
        kanbanSheet.getRange(r2,col).setValue(lead.nome).setFontWeight('bold').setFontSize(10);
        var alertEmoji = '✅';
        if (lead.giorniSilenzio > 60) alertEmoji = '⚫';
        else if (lead.giorniSilenzio > 30) alertEmoji = '🟠';
        else if (lead.giorniSilenzio > 14) alertEmoji = '🟡';
        else if (lead.giorniSilenzio > 7 && stadio === 'Secondo Appuntamento') alertEmoji = '🔴';
        var info = alertEmoji+' '+lead.giorniSilenzio+'gg | '+lead.probabilita+'% | €'+_formatNumber(lead.aum)+'\n📅 '+lead.followup;
        if (lead.noteFollowup) info += '\n📝 '+lead.noteFollowup.substring(0,40);
        kanbanSheet.getRange(r2,col+1).setValue(info).setWrap(true).setFontSize(9);
        var bgColor = '#e8f5e9';
        if (lead.giorniSilenzio > 60) bgColor = '#ffcdd2';
        else if (lead.giorniSilenzio > 30) bgColor = '#ffe0b2';
        else if (lead.giorniSilenzio > 14) bgColor = '#fff9c4';
        kanbanSheet.getRange(r2,col,1,2).setBackground(bgColor).setBorder(true,true,true,true,false,false,'#e0e0e0',SpreadsheetApp.BorderStyle.SOLID);
        kanbanSheet.setRowHeight(r2, 65);
      });
    }
    col += 2;
  });
  for (var cc3=1; cc3<=CONFIG.STADI_PIPELINE.length*2; cc3++) {
    kanbanSheet.setColumnWidth(cc3, cc3%2===1?140:180);
  }
  kanbanSheet.setFrozenRows(4); SpreadsheetApp.flush();
}
function aggiornaAnalisiConversione() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dbSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.DATABASE);
  var analisiSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ANALISI);
  if (!dbSheet) { SpreadsheetApp.getUi().alert('❌ Foglio DATABASE non trovato'); return; }
  if (!analisiSheet) { analisiSheet = ss.insertSheet(CONFIG.SHEET_NAMES.ANALISI); }
  analisiSheet.clear(); analisiSheet.clearFormats();
  var lastRow = _getLastDataRow(dbSheet);
  if (lastRow < 2) return;
  var data = dbSheet.getRange(2, 1, lastRow - 1, 26).getValues();
  var totaleRecord = data.filter(function(r){return r[0]&&r[0]!=='TOTALI';}).length;
  var stadiCount = {}, fonteAnalisi = {}, clusterAnalisi = {};
  var chiusi = 0, chiusiAum = 0;
  data.forEach(function(row) {
    var id = row[0]; if (!id || id === 'TOTALI' || id === '') return;
    var tipoCliente = row[2], fonte = row[3], stadio = row[5];
    var aum = typeof row[7]==='number'?row[7]:0, aumV = typeof row[9]==='number'?row[9]:0, cluster = row[19];
    var stadioIndex = CONFIG.STADI_PIPELINE.indexOf(stadio);
    for (var s = 0; s <= stadioIndex; s++) {
      var st = CONFIG.STADI_PIPELINE[s]; stadiCount[st] = (stadiCount[st]||0) + 1;
    }
    if (tipoCliente === 'Già Cliente') { chiusi++; chiusiAum += aumV; }
    if (fonte) {
      if (!fonteAnalisi[fonte]) fonteAnalisi[fonte] = {totale:0,chiuso:0,aumChiuso:0};
      fonteAnalisi[fonte].totale++;
      if (tipoCliente === 'Già Cliente') { fonteAnalisi[fonte].chiuso++; fonteAnalisi[fonte].aumChiuso += aumV; }
    }
    if (cluster) {
      if (!clusterAnalisi[cluster]) clusterAnalisi[cluster] = {totale:0,chiuso:0,aumTotale:0,aumChiuso:0};
      clusterAnalisi[cluster].totale++; clusterAnalisi[cluster].aumTotale += aum;
      if (tipoCliente === 'Già Cliente') { clusterAnalisi[cluster].chiuso++; clusterAnalisi[cluster].aumChiuso += aumV; }
    }
  });
  analisiSheet.getRange('A1').setValue('📈 ANALISI CONVERSIONE - Funnel & Performance');
  analisiSheet.getRange('A1:F1').merge().setBackground('#1a237e').setFontColor('#fff').setFontSize(16).setFontWeight('bold').setHorizontalAlignment('center');
  var r = 3;
  analisiSheet.getRange(r,1).setValue('🔽 FUNNEL DI CONVERSIONE');
  analisiSheet.getRange(r,1,1,5).merge().setBackground('#4a148c').setFontColor('#fff').setFontSize(13).setFontWeight('bold');
  r++;
  analisiSheet.getRange(r,1,1,5).setValues([['Stadio','N° Lead','% Totale','Conv. Stadio','Barra']]).setBackground('#6a1b9a').setFontColor('#fff').setFontWeight('bold').setHorizontalAlignment('center');
  r++;
  CONFIG.STADI_PIPELINE.forEach(function(stadio, i) {
    var count = stadiCount[stadio]||0;
    var prevCount = i>0?(stadiCount[CONFIG.STADI_PIPELINE[i-1]]||0):totaleRecord;
    var percTotale = totaleRecord>0?count/totaleRecord*100:0;
    var percConv = prevCount>0?count/prevCount*100:0;
    var blocchi = Math.round(percTotale/5), barra = '';
    for (var b=0;b<blocchi;b++) barra+='█';
    for (var b2=0;b2<20-blocchi;b2++) barra+='░';
    analisiSheet.getRange(r+i,1).setValue(stadio); analisiSheet.getRange(r+i,2).setValue(count).setHorizontalAlignment('center');
    analisiSheet.getRange(r+i,3).setValue(percTotale).setNumberFormat('0.0"%"');
    analisiSheet.getRange(r+i,4).setValue(i===0?100:percConv).setNumberFormat('0.0"%"');
    analisiSheet.getRange(r+i,5).setValue(barra).setFontFamily('monospace').setFontSize(9);
    var colSt2={'Prospect':'#fce4ec','Lead':'#e1f5fe','Primo Contatto':'#fff9c4','Appuntamento':'#f0f4c3','Secondo Appuntamento':'#dcedc8','Chiusura':'#c8e6c9'};
    analisiSheet.getRange(r+i,1,1,5).setBackground(colSt2[stadio]||'#f5f5f5');
  });
  r += CONFIG.STADI_PIPELINE.length;
  analisiSheet.getRange(r,1).setValue('✅ CLIENTI ACQUISITI'); analisiSheet.getRange(r,2).setValue(chiusi).setHorizontalAlignment('center');
  analisiSheet.getRange(r,3).setValue(totaleRecord>0?chiusi/totaleRecord*100:0).setNumberFormat('0.0"%"');
  analisiSheet.getRange(r,1,1,5).setBackground('#ffc107').setFontWeight('bold');
  r += 3;
  analisiSheet.getRange(r,1).setValue('📣 CONVERSIONE PER FONTE');
  analisiSheet.getRange(r,1,1,5).merge().setBackground('#0d47a1').setFontColor('#fff').setFontSize(13).setFontWeight('bold');
  r++;
  analisiSheet.getRange(r,1,1,5).setValues([['Fonte','Totali','Chiusi','Tasso Conv.','AUM Chiusi']]).setBackground('#1565c0').setFontColor('#fff').setFontWeight('bold').setHorizontalAlignment('center');
  r++;
  Object.keys(fonteAnalisi).sort().forEach(function(f, i) {
    var fa = fonteAnalisi[f];
    analisiSheet.getRange(r+i,1).setValue(f); analisiSheet.getRange(r+i,2).setValue(fa.totale).setHorizontalAlignment('center');
    analisiSheet.getRange(r+i,3).setValue(fa.chiuso).setHorizontalAlignment('center');
    analisiSheet.getRange(r+i,4).setValue(fa.totale>0?fa.chiuso/fa.totale*100:0).setNumberFormat('0.0"%"');
    analisiSheet.getRange(r+i,5).setValue(fa.aumChiuso).setNumberFormat('€#,##0');
    if (i%2===0) analisiSheet.getRange(r+i,1,1,5).setBackground('#e3f2fd');
  });
  r += Object.keys(fonteAnalisi).length + 2;
  analisiSheet.getRange(r,1).setValue('👥 CONVERSIONE PER CLUSTER');
  analisiSheet.getRange(r,1,1,5).merge().setBackground('#1b5e20').setFontColor('#fff').setFontSize(13).setFontWeight('bold');
  r++;
  analisiSheet.getRange(r,1,1,5).setValues([['Cluster','Totale','Chiusi','Tasso Conv.','AUM Medio Chiuso']]).setBackground('#2e7d32').setFontColor('#fff').setFontWeight('bold').setHorizontalAlignment('center');
  r++;
  Object.keys(clusterAnalisi).sort().forEach(function(cl, i) {
    var ca = clusterAnalisi[cl];
    analisiSheet.getRange(r+i,1).setValue(cl); analisiSheet.getRange(r+i,2).setValue(ca.totale).setHorizontalAlignment('center');
    analisiSheet.getRange(r+i,3).setValue(ca.chiuso).setHorizontalAlignment('center');
    analisiSheet.getRange(r+i,4).setValue(ca.totale>0?ca.chiuso/ca.totale*100:0).setNumberFormat('0.0"%"');
    analisiSheet.getRange(r+i,5).setValue(ca.chiuso>0?ca.aumChiuso/ca.chiuso:0).setNumberFormat('€#,##0');
    if (i%2===0) analisiSheet.getRange(r+i,1,1,5).setBackground('#e8f5e9');
  });
  for (var cc4=1;cc4<=6;cc4++) { analisiSheet.autoResizeColumn(cc4); }
  analisiSheet.setFrozenRows(1); SpreadsheetApp.flush();
}

// =====================================================
// MODULO 4: COMPLETAMENTO STRUTTURA
// =====================================================
function completaStruttura() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dbSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.DATABASE);
  if (!dbSheet) { dbSheet = ss.insertSheet(CONFIG.SHEET_NAMES.DATABASE); }
  var headers = ['ID','Nome e Cognome','Tipo Cliente','Fonte Lead','Data Primo Contatto','Stadio Pipeline','Prob. %','AUM Potenziale €','Data Versamento','AUM Versato €','Stato Contab.','Ultimo Contatto','Data Ultimo Contatto','Note Ultimo Contatto','Tipo Fee','Management Fee €','IUNP 36 €','Fee Only €','Note','Cluster Cliente','Giorni Silenzio','Alert Status','Prossimo Follow-up','Note Follow-up','Revenue Prevista €','Data Chiusura Prevista'];
  var currentHeader = dbSheet.getRange(1, 1, 1, 26).getValues()[0];
  if (!currentHeader[0] || currentHeader[0] === '') {
    dbSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  dbSheet.getRange(1,1,1,26).setBackground('#1a237e').setFontColor('#ffffff').setFontWeight('bold').setFontSize(10).setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  dbSheet.setRowHeight(1, 40);
  var lastRow = dbSheet.getLastRow();
  var hasTotali = false;
  if (lastRow > 1) {
    var valA = dbSheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < valA.length; i++) { if (valA[i][0] === 'TOTALI') { hasTotali = true; break; } }
  }
  if (!hasTotali) {
    var tr = lastRow + 1;
    dbSheet.getRange(tr,1).setValue('TOTALI');
    dbSheet.getRange(tr,8).setFormula('=SUMIF(C2:C'+(tr-1)+',"Potenziale",H2:H'+(tr-1)+')');
    dbSheet.getRange(tr,10).setFormula('=SUMIF(C2:C'+(tr-1)+',"Già Cliente",J2:J'+(tr-1)+')');
    dbSheet.getRange(tr,16).setFormula('=SUM(P2:P'+(tr-1)+')');
    dbSheet.getRange(tr,17).setFormula('=SUM(Q2:Q'+(tr-1)+')');
    dbSheet.getRange(tr,18).setFormula('=SUM(R2:R'+(tr-1)+')');
    dbSheet.getRange(tr,25).setFormula('=SUM(Y2:Y'+(tr-1)+')');
    dbSheet.getRange(tr,1,1,26).setBackground('#ffc107').setFontWeight('bold').setFontSize(12);
    dbSheet.getRange(tr,8).setNumberFormat('€#,##0'); dbSheet.getRange(tr,10).setNumberFormat('€#,##0');
    dbSheet.getRange(tr,16,1,3).setNumberFormat('€#,##0.00'); dbSheet.getRange(tr,25).setNumberFormat('€#,##0.00');
  }
  [CONFIG.SHEET_NAMES.KANBAN,CONFIG.SHEET_NAMES.DASHBOARD,CONFIG.SHEET_NAMES.ANALISI,CONFIG.SHEET_NAMES.CASHFLOW].forEach(function(nome) {
    if (!ss.getSheetByName(nome)) { var ns = ss.insertSheet(nome); ns.getRange('A1').setValue('⏳ Usa "🔄 Aggiorna TUTTO" dal menu'); }
  });
  dbSheet.setFrozenRows(1); dbSheet.setFrozenColumns(2);
  var colW = {1:40,2:180,3:100,4:100,5:100,6:130,7:60,8:120,9:100,10:120,11:100,12:80,13:100,14:200,15:100,16:100,17:100,18:100,19:200,20:100,21:80,22:100,23:100,24:200,25:110,26:110};
  Object.keys(colW).forEach(function(c) { dbSheet.setColumnWidth(parseInt(c), colW[c]); });
  SpreadsheetApp.getUi().alert('✅ Struttura Completata', 'Header, TOTALI, fogli e formattazione applicati!\n\nOra usa "🔄 Aggiorna TUTTO" per popolare i dashboard.', SpreadsheetApp.getUi().ButtonSet.OK);
}
function aggiornaTuttiIDashboard() {
  try {
    aggiornaDashboardRevenue(); aggiornaCashFlow(); aggiornaKanban(); aggiornaAnalisiConversione();
    SpreadsheetApp.getUi().alert('✅ Tutto Aggiornato!', '✓ Dashboard Revenue\n✓ Cash Flow\n✓ Kanban\n✓ Analisi Conversione', SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (error) { SpreadsheetApp.getUi().alert('❌ Errore: ' + error.toString()); }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================
function _getLastDataRow(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 1;
  var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = values.length - 1; i >= 0; i--) {
    if (values[i][0] === 'TOTALI') continue;
    if (values[i][0] !== '') return i + 2;
  }
  return 1;
}
function _formatNumber(num) {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
function _formatPercentage(num) {
  if (typeof num !== 'number' || isNaN(num)) return '0.0';
  return num.toFixed(1);
}
function _colLetter(n) {
  var result = '';
  while (n > 0) { n--; result = String.fromCharCode(65 + (n % 26)) + result; n = Math.floor(n / 26); }
  return result;
}
