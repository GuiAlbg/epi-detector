const CLASSES = ['com_epi', 'sem_epi', 'vazio'];

const ROTULOS = {
  com_epi: 'Com EPI',
  sem_epi: 'Sem EPI',
  vazio: 'Posto vazio'
};

const LIMIAR = 0.80;
const LEITURAS_PARA_CONFIRMAR = 5;

const elPlaca = document.getElementById('placa');
const elStatus = document.getElementById('status');
const elDetalhe = document.getElementById('detalhe');
const elClasses = document.getElementById('classes');
const elFormulario = document.getElementById('formulario');
const elLista = document.getElementById('lista-registros');

let classeCandidata = null;
let leiturasSeguidas = 0;
let classeConfirmada = null;

function montarBarras() {
  elClasses.innerHTML = CLASSES.map(classe => `
    <div class="classe" id="linha-${classe}">
      <div class="classe-topo">
        <span class="classe-nome">${ROTULOS[classe]}</span>
        <span class="classe-valor" id="valor-${classe}">0%</span>
      </div>
      <div class="barra"><span id="barra-${classe}"></span></div>
    </div>
  `).join('');
}
montarBarras();

function aoReceberPredicao(predicoes) {
  predicoes.forEach(p => {
    const pct = Math.round(p.probability * 100);
    document.getElementById(`valor-${p.className}`).textContent = pct + '%';
    document.getElementById(`barra-${p.className}`).style.width = pct + '%';
  });

  const melhor = predicoes.reduce((a, b) => a.probability > b.probability ? a : b);

  CLASSES.forEach(classe => {
    document.getElementById(`linha-${classe}`)
      .classList.toggle('dominante', classe === melhor.className);
  });

  if (melhor.probability < LIMIAR) {
    leiturasSeguidas = 0;
    return;
  }

  if (melhor.className === classeCandidata) {
    leiturasSeguidas++;
  } else {
    classeCandidata = melhor.className;
    leiturasSeguidas = 1;
  }

  if (leiturasSeguidas < LEITURAS_PARA_CONFIRMAR) return;

  if (classeCandidata !== classeConfirmada) {
    classeConfirmada = classeCandidata;
    executarAcao(classeConfirmada, melhor.probability);
  }
}

function executarAcao(classe, confianca) {
  const pct = Math.round(confianca * 100);

  if (classe === 'com_epi') {
    elFormulario.disabled = false;
    elPlaca.className = 'placa liberado';
    elStatus.textContent = 'Acesso liberado';
    elDetalhe.textContent = `EPI identificado com ${pct}% de confiança. Preencha o registro.`;

  } else if (classe === 'sem_epi') {
    elFormulario.disabled = true;
    elPlaca.className = 'placa negado';
    elStatus.textContent = 'Acesso bloqueado';
    elDetalhe.textContent = `Operador sem EPI (${pct}% de confiança). Coloque o equipamento para continuar.`;

  } else {
    elFormulario.disabled = true;
    elPlaca.className = 'placa';
    elStatus.textContent = 'Aguardando operador';
    elDetalhe.textContent = 'Nenhuma pessoa no posto.';
  }
}

document.getElementById('btn-registrar').addEventListener('click', () => {
  const nome = document.getElementById('nome').value.trim();
  const matricula = document.getElementById('matricula').value.trim();

  if (!nome || !matricula) {
    elDetalhe.textContent = 'Preencha nome e matrícula para registrar.';
    return;
  }

  const vazio = elLista.querySelector('.vazio');
  if (vazio) vazio.remove();

  const hora = new Date().toLocaleTimeString('pt-BR');
  const item = document.createElement('li');
  item.innerHTML = `<span class="hora">${hora}</span><span>${nome}</span><span>${matricula}</span>`;
  elLista.prepend(item);

  document.getElementById('nome').value = '';
  document.getElementById('matricula').value = '';
  elDetalhe.textContent = 'Entrada registrada.';
});

let classeSimulada = 'vazio';

function trocarSimulacao(classe, botao) {
  classeSimulada = classe;
  document.querySelectorAll('#simulador button')
    .forEach(b => b.setAttribute('aria-pressed', 'false'));
  botao.setAttribute('aria-pressed', 'true');
}

document.getElementById('btn-com').addEventListener('click', e => trocarSimulacao('com_epi', e.target));
document.getElementById('btn-sem').addEventListener('click', e => trocarSimulacao('sem_epi', e.target));
document.getElementById('btn-vazio').addEventListener('click', e => trocarSimulacao('vazio', e.target));

function gerarPredicaoFalsa() {
  const principal = 0.72 + Math.random() * 0.27;
  const sobra = 1 - principal;
  const outras = CLASSES.filter(c => c !== classeSimulada);
  const fatia = Math.random();

  return CLASSES.map(classe => {
    if (classe === classeSimulada) return { className: classe, probability: principal };
    const peso = classe === outras[0] ? fatia : (1 - fatia);
    return { className: classe, probability: sobra * peso };
  });
}

setInterval(() => aoReceberPredicao(gerarPredicaoFalsa()), 100);
