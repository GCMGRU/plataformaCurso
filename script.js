
let calendar; // variável global
let calendarioCarregado = false; // flag para renderizar só uma vez
let gradeFilterPelotao = '';
let dadosAlunos = {};  // irá conter { QRA: { carregarSubmissoesLiderancaAdmin()nome, pelotao, … } }
let aulas = {

}
let userRole = '';  // irá guardar 'admin', 'leader', etc.

document.addEventListener('DOMContentLoaded', () => {
  // ① Torna .main-content visível
  document.querySelector('.main-content').style.visibility = 'visible';
  // ② Abre Comunicados como seção inicial
  showSection('comunicados');
});

// ─── Agrupa array de docs por mês/ano (formato "YYYY-MM-DD") ───
function agruparPorMes(items) {
  return items.reduce((acc, doc) => {
    // Ajuste: se your doc.data tiver campo diferente, adapte aqui
    const [ano, mes] = (doc.data || doc.date || '').split('-').slice(0, 2);
    const chave = `${mes}/${ano}`;          // ex: "05/2025"
    acc[chave] = acc[chave] || [];
    acc[chave].push(doc);
    return acc;
  }, {});
}


const user = localStorage.getItem('nomeUsuario');
async function carregarDadosAluno() {
  // Pega o e-mail que você salvou no login
  const userEmail = localStorage.getItem('emailUsuario');
  if (!userEmail) {
    console.error("Usuário não logado ou e-mail não encontrado!");
    return;
  }

  try {
    // Busca o documento na coleção "usuarios"
    const docRef = db.collection('usuarios').doc(userEmail);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const dados = docSnap.data();

      // ===== Declaração do linkAdmin deve ficar AQUI =====
      const linkAdmin = document.getElementById('linkPainelAdmin');
      // ===================================================

     // Preenche os campos da aba Informações (com fallback para nomes antigos)
document.getElementById('qraAluno').value =
  dados.qraAluno    ?? dados.usuario  ?? '';

document.getElementById('pelotaoAluno').value =
  dados.pelotaoAluno ?? dados.pelotao ?? '';

document.getElementById('nomeCompleto').value =
  dados.nomeCompleto ?? dados.nome    ?? '';
  // Preenche o campo de e-mail (fallback para “emailAluno” caso seja o campo antigo)
document.getElementById('emailAluno').value =
  dados.email ?? dados.emailAluno ?? '';


      // converte qualquer "DD/MM/AAAA" ou "AAAA/MM/DD" em "AAAA-MM-DD"
      let dataStr = dados.dataNascimento || '';

      if (dataStr.includes('/')) {
        const partes = dataStr.split('/');
        if (partes[0].length === 4) {
          // já veio "AAAA/MM/DD"
          dataStr = partes.join('-');
        } else {
          // veio "DD/MM/AAAA"
          dataStr = [partes[2], partes[1], partes[0]].join('-');
        }
      }

      document.getElementById('dataNascimento').value = dataStr;

      document.getElementById('enderecoAluno').value = dados.enderecoAluno || '';
      document.getElementById('telefoneAluno').value = dados.telefoneAluno || '';
      document.getElementById('sangueAluno').value = dados.sangueAluno || '';

      // Mostra ou oculta o link de Painel Administrativo
      if (dados.role === 'admin') {
        linkAdmin.style.display = 'flex';
      } else {
        linkAdmin.style.display = 'none';
      } 


    } else {
      console.error("Documento do aluno não encontrado no Firestore!");
    }
  } catch (error) {
    console.error("Erro ao buscar dados do Firestore:", error);
  }

userRole = dados.role || '';

}

// Atualiza o nome do usuário no cabeçalho
const titulo = document.getElementById('titulo-bemvindo');
if (titulo && user) {
  titulo.textContent = `Bem-vindo(a), ${user}!`;
}

async function salvarDadosAluno() {
  const emailUsuario = localStorage.getItem('emailUsuario');
  if (!emailUsuario) {
    console.error("Email do usuário não encontrado no localStorage!");
    return;
  }

  try {
    const docRef = db.collection("usuarios").doc(emailUsuario);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.error("Documento do aluno não encontrado!");
      return;
    }

    const dadosExistentes = docSnap.data(); // Pega o que já existe

    // Corrigido: agora salva com os MESMOS nomes que você lê depois
    const dadosAtualizados = {
      ...dadosExistentes,
      nomeCompleto: document.getElementById('nomeCompleto').value,
      qraAluno: document.getElementById('qraAluno').value,
      cfAluno: document.getElementById('cfAluno').value,
      reAluno: document.getElementById('reAluno').value,
      pelotaoAluno: document.getElementById('pelotaoAluno').value,
      email: document.getElementById('emailAluno').value,
      cursoAluno: document.getElementById('cursoAluno')?.value || 'Formação de Guardas Municipais',
      cpfAluno: document.getElementById('cpfAluno').value,
      dataNascimento: document.getElementById('dataNascimento').value,
      enderecoAluno: document.getElementById('enderecoAluno').value,
      telefoneAluno: document.getElementById('telefoneAluno').value,
      sangueAluno: document.getElementById('sangueAluno').value
    };

    await docRef.set(dadosAtualizados, { merge: true });

    mostrarAviso("✅ Informações atualizadas com sucesso no Firestore!");
  } catch (error) {
    console.error("Erro ao salvar dados no Firestore:", error);
    mostrarAviso("⚠️ Erro ao salvar no banco de dados.");
  }
}


function atualizarListaAlunos() {
  const container = document.getElementById('listaAlunos'); // ID onde sua lista de alunos é exibida
  if (!container) return;

  container.innerHTML = ''; // Limpa a lista antiga

  const todasChaves = Object.keys(localStorage).filter(key => key.startsWith('dados_'));

  todasChaves.forEach(chave => {
    const dados = JSON.parse(localStorage.getItem(chave));
    const divAluno = document.createElement('div');
    divAluno.className = 'card-gestao';
    divAluno.innerHTML = `
    <strong>${dados.qraAluno}</strong> -${dados.nomeCompleto}  <br>
    Pelotão: ${dados.pelotaoAluno} <br>
    <button class="botao-gestao botao-editar" onclick="editarAluno('${chave}')"><i class="fas fa-pen"></i> Editar</button>
    <button class="botao-gestao botao-excluir" onclick="excluirAluno('${chave}')"><i class="fas fa-trash"></i> Excluir</button>
  `;

    container.appendChild(divAluno);
  });
}
const dados = JSON.parse(localStorage.getItem(`dados_${user}`)) || {};

document.getElementById('qraAluno').value = dados.qraAluno || '';
document.getElementById('cfAluno').value = dados.cfAluno || '';
document.getElementById('reAluno').value = dados.reAluno || '';
// Preenche o campo de e-mail (Firestore → email; fallback para emailAluno)
document.getElementById('emailAluno').value =
  dados.email    ?? dados.emailAluno ?? '';
document.getElementById('cursoAluno').value = dados.cursoAluno || 'Formação de Guardas Municipais';
document.getElementById('pelotaoAluno').value = dados.pelotaoAluno || '';

document.getElementById('nomeCompleto').value = dados.nomeCompleto || '';
document.getElementById('cpfAluno').value = dados.cpfAluno || '';
// pega a string original
let dataStr = dados.dataNascimento || '';

// se vier com barras, converte para traços
if (dataStr.includes('/')) {
  const partes = dataStr.split('/');
  if (partes[0].length === 4) {
    // formato AAAA/MM/DD → AAAA-MM-DD
    dataStr = partes.join('-');
  } else {
    // formato DD/MM/AAAA → AAAA-MM-DD
    dataStr = [partes[2], partes[1], partes[0]].join('-');
  }
}

// atribui ao date input
document.getElementById('dataNascimento').value = dataStr;

document.getElementById('enderecoAluno').value = dados.enderecoAluno || '';
document.getElementById('telefoneAluno').value = dados.telefoneAluno || '';
document.getElementById('sangueAluno').value = dados.sangueAluno || '';


// Atualiza pelotão na aba de liderança
const pelotao = dados.pelotaoAluno;
const exibir = document.getElementById('infoPelotao');
if (pelotao && pelotao !== '—' && exibir) {
  exibir.textContent = `(${pelotao.padStart(2, '0')}º Pelotão)`;
}

function showSection(id) {
  if (id === 'lideranca' && userRole !== 'leader' && userRole !== 'admin') {
  Swal.fire({
    icon: 'warning',
    title: 'Acesso restrito',
    text: 'Permitido acesso apenas do líder de pelotão.',
    confirmButtonColor: '#1d3557'
  });
  return;
}

  const sections = ['info', 'disciplinas', 'notas', 'grade', 'comunicados', 'linksImportantes', 'lideranca', 'sistemas', 'provas', 'controlePainel',];
  sections.forEach(sec => {
    const el = document.getElementById(sec);
    if (el) el.style.display = 'none';
  });

  const sectionToShow = document.getElementById(id);
  sectionToShow.style.display = 'block';
  if (id === 'lideranca') {
    carregarListaPresenca();
  }
  if (id === 'disciplinas') {
    document.querySelectorAll('.disciplina-card').forEach(card => {
      const nome = card.textContent.trim();
      const dados = dadosDisciplinas[nome] || {};
      const progresso = calcularProgresso(dados.carga, dados.cargaTotal);


      // Evita duplicar barras se já houver
      if (!card.querySelector('.progresso-mini')) {
        const container = document.createElement('div');
        container.style.marginTop = '8px';

        const barra = document.createElement('div');
        barra.className = 'progresso-mini';
        barra.innerHTML = `
  <div class="progresso-mini-barra" style="width: ${progresso}%"></div>
`;

        const texto = document.createElement('small');
        texto.className = 'porcentagem-texto';
        texto.textContent = `${progresso}%`;

        container.appendChild(barra);
        container.appendChild(texto);
        card.appendChild(container);


      }
    });
  }

  if (id === 'comunicados') {
    carregarComunicados(); // essa função preenche os comunicados
  }
  if (id === 'notas') {
    carregarBoletim();
    setTimeout(atualizarStatusBoletim, 100); // Atualiza status após os cards aparecerem
  }

  if (id === 'grade' && !calendarioCarregado) {

    setTimeout(() => {
      const calendarEl = document.getElementById('calendar');
      calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        initialDate: new Date(),
        height: 400,
        locale: 'pt-br',
        headerToolbar: {
          left: 'prev,next',
          center: 'title',
          right: ''
        },
        dateClick: function (info) {
          const dia = info.dateStr;
          const pel = gradeFilterPelotao;
          const container = document.getElementById('aulasDoDia');
          const btnPDF = document.getElementById('baixar-pdf');
          const btnImg = document.getElementById('baixar-imagem');

          // 1) Reseta conteúdo e esconde ambos os botões
          container.innerHTML = '';
          if (btnPDF) btnPDF.style.display = 'none';
          if (btnImg) btnImg.style.display = 'none';

          const dataEntry = aulas[dia]?.[pel] || {};

          // 2) Se for imagem, mostra <img> e exibe botão de download de imagem
          if (dataEntry.imageUrl) {
            container.innerHTML = `
            <img src="${dataEntry.imageUrl}"
                 alt="Grade de ${pel} em ${dia}"
                 style="max-width:100%; border-radius:8px;">
          `;
            if (btnImg) {
              btnImg.style.display = 'inline-block';
              btnImg.onclick = () => {
                const imgEl = container.querySelector('img');
                if (!imgEl) return;
                const link = document.createElement('a');
                link.href = imgEl.src;
                link.download = `Grade_${pel}_${dia}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                Swal.fire({
                  icon: 'success',
                  title: 'Download concluído',
                  text: 'Imagem da grade salva no seu dispositivo.',
                  confirmButtonColor: '#1d3557'
                });
              };
            }
            return;
          }

          // 3) Se for lista de aulas (Excel/CSV), monta tabela e mostra PDF
          if (Array.isArray(dataEntry) && dataEntry.length) {
            let html = `<h3>${pel ? pel + 'º Pelotão' : 'Todos Pelotões'} – ${dia}</h3>
            <table style="width:100%; border-collapse: collapse;">
              <thead><tr>
                <th style="padding:8px; text-align:left;">Horário</th>
                <th style="padding:8px; text-align:left;">Matéria</th>
              </tr></thead>
              <tbody>`;
            dataEntry.forEach(a => {
              html += `<tr>
              <td style="padding:6px;">${a.horario}</td>
              <td style="padding:6px;">${a.materia}</td>
            </tr>`;
            });
            html += `</tbody></table>`;
            container.innerHTML = html;
            if (btnPDF) btnPDF.style.display = 'inline-block';
            return;
          }

          // 4) Caso não haja nada
          container.innerHTML = `<p style="color:#555;">
          Nenhuma aula para ${pel ? pel + 'º Pelotão' : 'os pelotões'} em ${dia}.
        </p>`;
          // ambos os botões permanecem escondidos
        }

      });
      calendar.render();
      calendarioCarregado = true;
    }, 100); // delay garante que o elemento esteja visível
  }

  if (id === 'grade' && calendar) {
    setTimeout(() => {
      calendar.render();
    }, 100); // Pequeno delay para garantir que o container esteja visível
  }


  // Se for dispositivo móvel, rola até a seção visível
  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    const delay = (id === 'notas') ? 300 : 100; // tempo extra para o boletim
    setTimeout(() => {
      sectionToShow.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, delay);
  }
  if (id === 'provas') {
    carregarProvas();
  }

}
document.getElementById('searchInput').addEventListener('input', function () {
  const filtro = this.value.toLowerCase().trim();
  const cards = document.querySelectorAll('.disciplina-card, .card-boletim, .card-sistema');
  const comunicadosBox = document.getElementById('listaComunicados');
  const comunicadosDiv = document.getElementById('comunicados');

  const msgAntiga = document.getElementById('mensagem-resultado');
  if (msgAntiga) msgAntiga.remove();

  if (filtro === '') {
    const sections = ['info', 'disciplinas', 'notas', 'grade', 'comunicados', 'linksImportantes', 'lideranca', 'sistemas'];
    sections.forEach(sec => {
      const el = document.getElementById(sec);
      if (el) el.style.display = sec === 'info' ? 'block' : 'none';
    });

    cards.forEach(card => {
      const parentLink = card.closest('a');
      if (card.classList.contains('card-sistema') && parentLink) {
        parentLink.style.display = 'block';
        card.style.display = 'block';
      } else {
        card.style.display = 'flex';
      }
    });

    return;
  }

  // Navegação rápida
  if (filtro.includes('boletim')) { showSection('notas'); return; }
  if (filtro.includes('info')) { showSection('info'); return; }
  if (filtro === 'disciplina' || filtro === 'disciplinas') {
    showSection('disciplinas');
    document.querySelectorAll('.disciplina-card').forEach(card => {
      card.style.display = 'flex';
    });
    return;
  }
  if (filtro.includes('grade')) { showSection('grade'); return; }
  if (filtro.includes('comunicado')) { showSection('comunicados'); return; }
  if (filtro.includes('lider') || filtro.includes('presenca') || filtro.includes('relatorio')) {
    showSection('lideranca');
    return;
  }
  if (filtro.includes('sistema') || filtro.includes('sisgcm') || filtro.includes('sinesp')) {
    showSection('sistemas');
    return;
  }
  if (filtro.includes('link') || filtro.includes('prefeitura') || filtro.includes('pop') || filtro.includes('portaria')) {
    showSection('linksImportantes');
    return;
  }
  if (filtro.includes('prova')) { showSection('provas'); return; }
  if (
    filtro.includes('lider') ||
    filtro.includes('presenca') ||
    filtro.includes('relatorio') ||
    filtro.includes('área de segurança') ||
    filtro.includes('area') ||
    filtro.includes('segurança')

  ) {
    showSection('lideranca');
    return;
  }

  // Busca geral em cards
  let encontrou = false;
  cards.forEach(card => {
    const nome = card.textContent.toLowerCase();
    const mostrar = nome.includes(filtro);
    const parentLink = card.closest('a');

    if (mostrar) {
      if (card.classList.contains('disciplina-card') || card.classList.contains('card-boletim')) {
        card.style.display = 'flex';
      } else if (card.classList.contains('card-sistema') && parentLink) {
        parentLink.style.display = 'block';
        card.style.display = 'block';
      }
      encontrou = true;
    } else {
      if (card.classList.contains('card-sistema') && parentLink) {
        parentLink.style.display = 'none';
      } else {
        card.style.display = 'none';
      }
    }
  });

  if (encontrou) {
    if (document.querySelector('.disciplina-card[style*="flex"]')) {
      showSection('disciplinas');
    } else if (document.querySelector('.card-boletim[style*="flex"]')) {
      showSection('notas');
    } else if (document.querySelector('.card-sistema[style*="block"]')) {
      showSection('sistemas');
    }
    return;
  }

  // Busca nos comunicados
  const comunicadosFiltrados = comunicados.filter(c =>
    c.titulo.toLowerCase().includes(filtro) ||
    c.data.toLowerCase().includes(filtro) ||
    c.html.toLowerCase().includes(filtro)
  );

  if (comunicadosFiltrados.length > 0) {
    comunicadosBox.innerHTML = '';
    comunicadosFiltrados.forEach(c => {
      const box = document.createElement('div');
      box.style.background = '#ffffff';
      box.style.border = '1px solid #dee2e6';
      box.style.borderRadius = '10px';
      box.style.padding = '15px';
      box.style.boxShadow = '0 3px 8px rgba(0, 0, 0, 0.06)';
      box.innerHTML = `
        <h3 style="color:#1d3557; margin-bottom:5px;">${c.titulo}</h3>
        <p style="color:#6c757d; font-size:14px; margin-bottom:10px;"><i class="fas fa-calendar-alt"></i> ${c.data}</p>
        <div style="font-size:15px; color:#333;">${c.html}</div>
      `;
      comunicadosBox.appendChild(box);
    });

  }

  // Se não encontrou nada
  const sections = ['info', 'disciplinas', 'notas', 'grade', 'comunicados', 'linksImportantes', 'lideranca', 'sistemas'];
  sections.forEach(sec => {
    const el = document.getElementById(sec);
    if (el) el.style.display = 'none';
  });

  const msg = document.createElement('p');
  msg.id = 'mensagem-resultado';
  msg.style.fontSize = '1.1rem';
  msg.style.color = '#000';
  msg.style.marginTop = '20px';
  msg.style.textAlign = 'center';
  msg.innerHTML = `Nenhum resultado encontrado com: <strong>"${filtro}"</strong>`;
  document.querySelector('.main-content').appendChild(msg);
});

// Dados das disciplinas com estrutura completa
const dadosDisciplinas = {

};
// -> carrega do Firestore e preenche dadosDisciplinas
async function carregarDisciplinasFirestore() {
  try {
    const snapshot = await db.collection('disciplinas').get();
    snapshot.forEach(doc => {
      const nome = doc.id;
      const data = doc.data();
      if (!dadosDisciplinas[nome]) dadosDisciplinas[nome] = { professor: '', carga: '', material: [], pelotao: '' };
      // preenche também o cargaTotal
      dadosDisciplinas[nome].professor  = data.professor  || '';
      dadosDisciplinas[nome].carga      = data.carga      || '';
      dadosDisciplinas[nome].pelotao    = data.pelotao    || '';
      dadosDisciplinas[nome].cargaTotal = data.cargaTotal || '';
      dadosDisciplinas[nome].material   = data.material   || [];
    });
  } catch (err) {
    console.error('Erro ao carregar disciplinas:', err);
  }
}

const calcularProgresso = (carga, cargaTotal) => {
  const c = parseFloat(carga);
  const t = parseFloat(cargaTotal);
  if (isNaN(c) || isNaN(t) || t === 0) return 0;
  return Math.min(100, Math.round((c / t) * 100));
};


document.querySelectorAll('.disciplina-card').forEach(card => {
  const nome = card.textContent.trim();

  card.addEventListener('click', () => {
    const jaAberto = card.nextElementSibling?.classList.contains('card-expandido');

    // Fecha todas as seções abertas
    document.querySelectorAll('.card-expandido').forEach(el => el.remove());

    // Se já estava aberto, não reabre
    if (jaAberto) return;

    const dados = dadosDisciplinas[nome] || {};
    const div = document.createElement('div');
    div.className = 'card-expandido';

    const materialLinks = (dados.material && dados.material.length > 0)
      ? dados.material.map(m => `<a href="${m.link}" target="_blank">${m.nome}</a>`).join('')
      : '<p style="color:#777;">Nenhum material disponível.</p>';

    const progresso = calcularProgresso(dados.concluido, dados.carga);

    div.innerHTML = `
    <p><strong>Professor:</strong> ${dados.professor || ''}</p>
    <p><strong>Carga Horária:</strong> ${dados.cargaTotal || '—'}</p>
    <div><strong>Material:</strong><br>${(dados.material && dados.material.length > 0)
        ? dados.material.map(m => `<a href="${m.link}" target="_blank">${m.nome}</a>`).join('')
        : '<p style="color:#777;">Nenhum material disponível.</p>'
      }</div>
  `;


    card.insertAdjacentElement('afterend', div);
  });
});


function fecharModal() {
  document.getElementById('modalDisciplina').style.display = 'none';
}

document.addEventListener('click', async function (e) {
  if (e.target && e.target.id === 'baixar-pdf') {
    const original = document.getElementById('conteudo-pdf');
    if (!original) {
      return Swal.fire({
        icon: 'info',
        title: 'Nenhuma grade disponível',
        text: 'Não há grade para exportar.',
        confirmButtonColor: '#1d3557'
      });

      return;
    }

    // Cria um clone visível mas invisível para o usuário
    const clone = original.cloneNode(true);
    clone.style.visibility = 'hidden';
    clone.style.position = 'absolute';
    clone.style.top = '0';
    clone.style.left = '0';
    clone.style.width = '800px';
    clone.style.background = 'white';
    clone.style.padding = '20px';
    clone.style.zIndex = '-1';

    document.body.appendChild(clone);

    await new Promise(resolve => setTimeout(resolve, 500)); // espera renderizar

    const opt = {
      margin: 0.5,
      filename: `Grade_${new Date().toLocaleDateString('pt-BR')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(clone).save()
      .then(() => {
        document.body.removeChild(clone);
        Swal.fire({
          icon: 'success',
          title: 'Exportação concluída',
          text: 'PDF salvo no seu dispositivo.',
          confirmButtonColor: '#1d3557'
        });
      });

  }
});


document.addEventListener('DOMContentLoaded', async () => {
  await carregarDadosAluno(); // <<<< Puxando dados direto do Firestore agora!
  await carregarDisciplinasFirestore();
  await carregarPelotoes();
  const selectDisc = document.getElementById('selectDisc');
 await carregarQRAsAlunos();          // popula outros selects :contentReference[oaicite:2]{index=2}
  carregarAlunosParaAvisos();          // popula nosso select de avisos
  await carregarPelotoesAvisos();
   updateBadge();
  document.getElementById('selectPelotaoAvisos')
        .addEventListener('change', carregarAlunosParaAvisos);

  document.getElementById("btnEnviarAviso")
          .addEventListener("click", enviarAviso);
  populateSelectDisc();       // já existia
  populateGridDisciplinas();  // <<< insira aqui
  // --- Adicionar Disciplina ---
  document.getElementById('btnAddDisciplina').addEventListener('click', () => {
    Swal.fire({
      title: 'Adicionar Nova Disciplina',
      input: 'text',
      inputPlaceholder: 'Digite o nome da disciplina',
      showCancelButton: true,
      confirmButtonText: 'Adicionar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1d3557',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Por favor, insira um nome!';
        }
      }
    }).then(async (result) => {
      if (!result.isConfirmed) return;                 // usuário cancelou
      const novoNome = result.value.trim();
  
      // evita duplicata
      if (dadosDisciplinas[novoNome]) {
        return Swal.fire({ icon: 'warning', title: 'Disciplina já existe' });
      }
  
      // cria objeto local e persiste no Firestore
      dadosDisciplinas[novoNome] = { professor: '', carga: '', material: [] };
      try {
        await db.collection('disciplinas').doc(novoNome).set({
          professor: '',
          carga: '',
          material: []
        });
        populateSelectDisc();           // atualiza o select
        Swal.fire({ icon: 'success', title: 'Disciplina adicionada!' });
  
        // Atualiza a aba Disciplinas
        const grid = document.querySelector('#disciplinas .disciplinas-grid');
        const newCard = document.createElement('div');
        newCard.className = 'disciplina-card';
        newCard.textContent = novoNome;
        // (reaproveite aqui o listener de clique que você já usa nos cards)
        /* … código para listener e append … */
        grid.appendChild(newCard);
      } catch (err) {
        console.error('Erro ao adicionar disciplina:', err);
        Swal.fire({ icon: 'error', title: 'Falha ao adicionar disciplina' });
      }
    });
  });
  

  // --- Remover Disciplina ---
  document.getElementById('btnRemoveDisciplina').addEventListener('click', async () => {
    const disciplina = document.getElementById('selectDisc').value;
    if (!disciplina) {
      return Swal.fire({ icon: 'warning', title: 'Selecione uma disciplina para remover' });
    }
    const { isConfirmed } = await Swal.fire({
      icon: 'warning',
      title: `Remover "${disciplina}"?`,
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sim, remover'
    });
    if (!isConfirmed) return;

    try {
      await db.collection('disciplinas').doc(disciplina).delete();
      delete dadosDisciplinas[disciplina];
      populateSelectDisc();
      populateGridDisciplinas();          // ← aqui: refaz os cards na aba Disciplinas
      Swal.fire({ icon: 'success', title: 'Disciplina removida!' });
    } catch (err) {
      console.error('Erro ao remover disciplina:', err);
      Swal.fire({ icon: 'error', title: 'Falha ao remover disciplina' });
    }
  });
  // --- Remover todas as disciplinas de uma vez ---
  document.getElementById('btnClearDisciplinas').addEventListener('click', async () => {
    const result = await Swal.fire({
      title: 'Remover todas as disciplinas?',
      text: 'Isso excluirá permanentemente todas as disciplinas do sistema.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, remover tudo',
      cancelButtonText: 'Cancelar'
    });
    if (!result.isConfirmed) return;

    try {
      // percorre todas as chaves atuais
      const nomes = Object.keys(dadosDisciplinas);
      for (const nome of nomes) {
        await db.collection('disciplinas').doc(nome).delete();
        delete dadosDisciplinas[nome];
      }
      // atualiza UI
      populateSelectDisc();
      populateGridDisciplinas();
      Swal.fire({ icon: 'success', title: 'Todas as disciplinas foram removidas.' });
    } catch (err) {
      console.error('Erro ao limpar disciplinas:', err);
      Swal.fire({ icon: 'error', title: 'Falha ao remover todas as disciplinas.' });
    }
  });



  // Quando mudar a seleção, pré-preenche o form
  selectDisc.addEventListener('change', () => {
    const nome = selectDisc.value;  // disciplina escolhida
    const dados = dadosDisciplinas[nome] || { professor: '', carga: '', material: [] };

    // preenche professor e carga
    document.getElementById('inputProfessor').value = dados.professor;
    document.getElementById('inputCarga').value = dados.carga;
    document.getElementById('inputPelotaoDisciplina').value = dados.pelotao;
document.getElementById('inputCargaTotal').value = dados.cargaTotal || '';

    // carrega materiais existentes no array temporário
    materiaisTemp = Array.isArray(dados.material) ? [...dados.material] : [];
    renderListaMateriais();  // redesenha o <ul id="listaMateriais">
  });


  // → Novo: ao clicar no sino, busca avisos e exibe em modal
document.getElementById("btnAvisos").addEventListener("click", async () => {
  const userEmail = localStorage.getItem('emailUsuario');
  if (!userEmail) return Swal.fire({ icon: 'error', title: 'Usuário não encontrado.' });
  
  const snap = await db
    .collection("usuarios")
    .doc(userEmail)
    .collection("avisos")
    .orderBy("dataEnviado", "desc")
    .get();
  if (snap.empty) {
    return Swal.fire({ icon: 'info', title: '🔔 Meus Avisos', text: 'Você não possui avisos no momento.' });
  }

  let html = '';
  snap.docs.forEach(doc => {
    const { mensagem, dataEnviado } = doc.data();
    const dt = dataEnviado.toDate().toLocaleString("pt-BR");
    html += `<div style="margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid #eee;">
               <p>${mensagem}</p>
               <small style="color:#666;">Enviado: ${dt}</small>
             </div>`;
  });

  Swal.fire({
    title: '🔔 Meus Avisos',
    html,
    width: 600,
    confirmButtonText: 'Fechar',
    confirmButtonColor: '#1d3557',
    showClass: { popup: 'animate__animated animate__fadeInDown' },
    hideClass: { popup: 'animate__animated animate__fadeOutUp' }
  }).then(async () => {
    // batch para marcar lido
    const batch = db.batch();
    snap.docs.forEach(doc => batch.update(doc.ref, { lido: true }));
    await batch.commit();
    updateBadge();  // oculta ou atualiza o badge
  });
});

document.addEventListener('DOMContentLoaded', async () => {
  await carregarDadosAluno();
  await carregarDisciplinasFirestore();
  // … demais carregamentos …
  updateBadge();  // inicializa o badge
});

document.getElementById('linkEAD').addEventListener('click', function(e) {
  e.preventDefault();  // evita scroll/pular para o topo
  Swal.fire({
    title: 'Indisponível!',
    text: 'A aba EAD ainda não está disponivel!',
    icon: 'info',
    confirmButtonColor: '#1d3557',
    showClass: {
      popup: 'animate__animated animate__fadeInDown'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOutUp'
    }
  });
});  
// ——— Pesquisa interna em Gestão de Alunos ———
  const searchInput = document.getElementById('searchAluno');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const filtro = searchInput.value.trim().toLowerCase();
      const alunosContainer = document.getElementById('alunosContainer');
      alunosContainer.innerHTML = '';

      if (!filtro) {
        if (pelotaoAtivo) listarAlunosPorPelotao(pelotaoAtivo);
        return;
      }

      // Carrega todos os alunos do localStorage
      const todosDados = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('dados_')) {
          const aluno = JSON.parse(localStorage.getItem(key));
          todosDados.push(aluno);
        }
      }

      // Filtra de forma case-insensitive tanto Pelotão quanto QRA
      const filtrados = todosDados.filter(a => {
        const pelotao = String(a.pelotaoAluno).toLowerCase();
        const qra = String(a.qraAluno).toLowerCase();
        return pelotao.includes(filtro) || qra.includes(filtro);
      });

      if (filtrados.length === 0) {
        alunosContainer.innerHTML = '<p style="color:#777;">Nenhum aluno encontrado.</p>';
        return;
      }

      // Reabre os cards filtrados
      filtrados.forEach(aluno => {
        const card = document.createElement('div');
        card.className = 'card-gestao';
        card.innerHTML = `
        <strong>${aluno.qraAluno || '—'}</strong><br>
        <small>${aluno.cfAluno || '-'}</small><br>
        <small>Pelotão: ${aluno.pelotaoAluno || '-'}</small>
      `;
        card.onclick = () => abrirModalAluno(aluno, aluno._key);
        alunosContainer.appendChild(card);
      });
    });
  }
  // —–––– Importação de Grade de Aula ––––
  // —— Importação de Grade de Aula ——
  document.getElementById('btnImportar').addEventListener('click', () => {
    const date = document.getElementById('scheduleDate').value;
    const pel = document.getElementById('schedulePelotao').value.padStart(2, '0');
    const fileInput = document.getElementById('scheduleFile');

    // 1) Verifica campos
    if (!date || !pel.trim() || fileInput.files.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Selecione data, pelotão e um arquivo para importar.',
        confirmButtonColor: '#1d3557'
      });
      return;
    }

    const file = fileInput.files[0];
    const ext = file.name.split('.').pop().toLowerCase();

    // Garante estrutura interna
    if (!aulas[date]) aulas[date] = {};
    aulas[date][pel] = [];

    // 2) Se for imagem
    if (['png', 'jpg', 'jpeg'].includes(ext)) {
      const url = URL.createObjectURL(file);
      aulas[date][pel] = { imageUrl: url };
      Swal.fire({
        icon: 'success',
        title: 'Imagem Importada',
        text: `Grade do Pelotão ${pel} em ${date} importada com sucesso.`,
        confirmButtonColor: '#1d3557'
      });
      return;
    }

    // 3) Se for Excel
    if (['xlsx', 'xls'].includes(ext)) {
      const reader = new FileReader();
      reader.onload = e => {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const lista = rows.slice(1).map(r => ({
          horario: r[0] || '',
          materia: r[1] || ''
        }));
        aulas[date][pel] = lista;
        Swal.fire({
          icon: 'success',
          title: 'Excel Importado',
          text: `${lista.length} aulas importadas para o Pelotão ${pel} em ${date}.`,
          confirmButtonColor: '#1d3557'
        });
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    // 4) Se for CSV
    if (ext === 'csv') {
      const reader = new FileReader();
      reader.onload = e => {
        const lista = e.target.result.trim()
          .split('\n')
          .map(l => {
            const [horario, materia] = l.split(',');
            return { horario, materia };
          });
        aulas[date][pel] = lista;
        Swal.fire({
          icon: 'success',
          title: 'CSV Importado',
          text: `${lista.length} aulas importadas para o Pelotão ${pel} em ${date}.`,
          confirmButtonColor: '#1d3557'
        });
      };
      reader.readAsText(file);
      return;
    }

    // 5) Formato não suportado
    Swal.fire({
      icon: 'error',
      title: 'Formato inválido',
      text: 'Use imagem (PNG/JPG), planilha Excel (.xlsx/.xls) ou CSV.',
      confirmButtonColor: '#1d3557'
    });
  });
  // —— Remover Grade de Aula ——
  document.getElementById('btnRemover').addEventListener('click', () => {
    const date = document.getElementById('scheduleDate').value;
    const pel = document.getElementById('schedulePelotao').value.padStart(2, '0');

    if (!date || !pel.trim()) {
      return Swal.fire({
        icon: 'warning',
        title: 'Selecione data e pelotão',
        text: 'Para remover, informe data e pelotão.',
        confirmButtonColor: '#1d3557'
      });
    }

    if (aulas[date] && aulas[date][pel]) {
      delete aulas[date][pel];
      // se não houver mais pelotões naquele dia, apaga o objeto todo
      if (Object.keys(aulas[date]).length === 0) {
        delete aulas[date];
      }
      if (calendar) calendar.render();

      return Swal.fire({
        icon: 'success',
        title: 'Grade Removida',
        text: `Pelotão ${pel} em ${date} removido com sucesso.`,
        confirmButtonColor: '#1d3557'
      });
    }

    Swal.fire({
      icon: 'info',
      title: 'Nada para remover',
      text: `Não há grade cadastrada para ${pel}º Pelotão em ${date}.`,
      confirmButtonColor: '#1d3557'
    });
  });


  // 2) Gerenciar lista temporária de materiais
  let materiaisTemp = [];
  const btnAddMaterial = document.getElementById('btnAddMaterial');
  const btnSaveDisciplina = document.getElementById('btnSaveDisciplina');
  const listaMateriaisDiv = document.getElementById('listaMateriais');

  function renderListaMateriais() {
    listaMateriaisDiv.innerHTML = '';
    materiaisTemp.forEach((m, i) => {
      const li = document.createElement('li');
      li.style.display = 'flex';
      li.style.alignItems = 'center';
      li.style.margin = '4px 0';
      li.innerHTML = `
      <input type="radio" name="materialSelecionado" value="${i}" style="margin-right:8px;">
      <a href="${m.link}" target="_blank">${m.nome}</a>
    `;
      listaMateriaisDiv.appendChild(li);
    });
  }

  btnAddMaterial.addEventListener('click', () => {
    const nome = document.getElementById('inputMaterialNome').value.trim();
    const link = document.getElementById('inputMaterialLink').value.trim();
    if (!nome || !link) {
      return Swal.fire({ icon: 'warning', title: 'Preencha nome e link' });
    }
    materiaisTemp.push({ nome, link });
    renderListaMateriais();
    document.getElementById('inputMaterialNome').value = '';
    document.getElementById('inputMaterialLink').value = '';
  });
  document.getElementById('btnRemoveMaterial').addEventListener('click', () => {
    const sel = document.querySelector('input[name="materialSelecionado"]:checked');
    if (!sel) {
      return Swal.fire({ icon: 'warning', title: 'Selecione um material para remover' });
    }
    const idx = parseInt(sel.value, 10);
    materiaisTemp.splice(idx, 1);
    renderListaMateriais();
  });


  // 3) Salvar dados da disciplina (local + Firestore)
  btnSaveDisciplina.addEventListener('click', async () => {
    const disciplina = document.getElementById('selectDisc').value;
    if (!disciplina) {
      return Swal.fire({ icon: 'warning', title: 'Selecione uma disciplina' });
    }
    const prof = document.getElementById('inputProfessor').value.trim();
    const carga = document.getElementById('inputCarga').value.trim();
    const pelotao      = document.getElementById('inputPelotaoDisciplina').value.trim().padStart(2, '0');
    const cargaTotal  = document.getElementById('inputCargaTotal') .value.trim();
    // Atualiza o objeto local
    dadosDisciplinas[disciplina].professor = prof;
    dadosDisciplinas[disciplina].carga = carga;
    dadosDisciplinas[disciplina].pelotao   = pelotao;
    dadosDisciplinas[disciplina].cargaTotal = cargaTotal;
    dadosDisciplinas[disciplina].material = materiaisTemp;
    try {
      // Persiste no Firestore
      await db.collection('disciplinas').doc(disciplina).set({
        professor: prof,
        carga: carga,
        pelotao:   pelotao,
        cargaTotal: cargaTotal,
        material: materiaisTemp
      }, { merge: true });
      Swal.fire({ icon: 'success', title: 'Disciplina salva com sucesso!' });
    } catch (error) {
      console.error('Erro ao salvar disciplina:', error);
      Swal.fire({ icon: 'error', title: 'Falha ao salvar' });
    }
    // Limpa inputs e lista
    materiaisTemp = [];
    listaMateriaisDiv.innerHTML = '';
    document.getElementById('inputProfessor').value = '';
    document.getElementById('inputCarga').value = '';
    document.getElementById('inputPelotaoDisciplina').value = '';
    document.getElementById('inputCargaTotal').value = '';
  });

  function populateSelectDisc() {
    const select = document.getElementById('selectDisc');
    select.innerHTML = '<option value="">Selecione uma disciplina</option>';

    // ① pega e ordena alfabeticamente
    const nomesOrdenados = Object
      .keys(dadosDisciplinas)
      .sort((a, b) => a.localeCompare(b, 'pt', { ignorePunctuation: true }));

    nomesOrdenados.forEach(nome => {
      const opt = document.createElement('option');
      opt.value = nome;
      opt.textContent = nome;
      select.appendChild(opt);
    });
  }

  // --- Preenche o grid de cards de Disciplinas com base em dadosDisciplinas ---
  function populateGridDisciplinas() {
    const grid = document.querySelector('#disciplinas .disciplinas-grid');
    grid.innerHTML = ''; // limpa tudo
    const nomesOrdenados = Object
      .keys(dadosDisciplinas)
      .sort((a, b) => a.localeCompare(b, 'pt', { ignorePunctuation: true }));

    nomesOrdenados.forEach(nome => {
        // Filtra disciplinas de outros pelotões:
        const userPel = document.getElementById('pelotaoAluno').value.padStart(2, '0');
  const discPel = dadosDisciplinas[nome].pelotao;
  if (discPel && discPel !== userPel) return;
      const card = document.createElement('div');
      card.className = 'disciplina-card';
      card.textContent = nome;
      // mesmo listener de clique dos cards estáticos
      card.addEventListener('click', () => {
        const jaAberto = card.nextElementSibling?.classList.contains('card-expandido');
        document.querySelectorAll('.card-expandido').forEach(el => el.remove());
        if (jaAberto) return;

        const dados = dadosDisciplinas[nome] || {};
        const div = document.createElement('div');
        div.className = 'card-expandido';
        div.innerHTML = `
        <p><strong>Professor:</strong> ${dados.professor || '—'}</p>
<p><strong>Carga Horária:</strong> ${dados.cargaTotal || '—'}</p>
        <div><strong>Material:</strong><br>${(dados.material && dados.material.length > 0)
            ? dados.material.map(m => `<a href="${m.link}" target="_blank">${m.nome}</a>`).join('')
            : '<p style="color:#777;">Nenhum material disponível.</p>'
          }</div>
      `;
        card.insertAdjacentElement('afterend', div);
      });

      grid.appendChild(card);
    });
  }


  document.addEventListener('DOMContentLoaded', async () => {
    await carregarDadosAluno();           // Firestore → dadosAluno
    await carregarDisciplinasFirestore(); // Firestore → dadosDisciplinas
    await carregarPelotoes();
    await carregarQRAsAlunos();              // 🔹 Popular select de QRA
    carregarDisciplinasNoSelectNotas();
    populateSelectDisc();      // ① Preenche o <select> de disciplinas
    populateGridDisciplinas(); // ② Gera todos os cards na aba Disciplinas

  });

  // —–––– Função de preview da grade antes de excluir ––––
  function atualizarPreview() {
    // ... corpo da função ...
  }

  // dispara preview ao mudar data ou pelotão
  document.getElementById('scheduleDate').addEventListener('change', atualizarPreview);
  document.getElementById('schedulePelotao').addEventListener('input', atualizarPreview);
  // preview inicial
  atualizarPreview();


  // —–––– Ajuste no dateClick para filtrar por pelotão ativo ––––
  FullCalendar.onDateClick = function (info) {
    // remove destaque e adiciona no dia
    document.querySelectorAll('.fc-daygrid-day').forEach(c => c.classList.remove('data-selecionada'));
    info.dayEl.classList.add('data-selecionada');

    const day = info.dateStr;
    const pel = pelotaoAtivo;
    const container = document.getElementById('aulasDoDia');
    const btnPDF = document.getElementById('baixar-pdf');
    container.innerHTML = '';

    const diaObj = aulas[day] && aulas[day][pel] ? aulas[day][pel] : [];
    if (diaObj.length) {
      // monta tabela igual antes, usando diaObj
      let html = `<h2>Aulas do Dia</h2><h3>${pel}º Pelotão – ${day}</h3><table>…</table>`;
      container.innerHTML = html;
      btnPDF.style.display = 'inline-block';
    } else {
      container.innerHTML = `<p>Nenhuma grade para ${pel}º Pelotão em ${day}.</p>`;
      btnPDF.style.display = 'none';
    }
  };

});
// Toggle dedicado para “Submissões da Liderança”
const toggleLiderancaBtn = document.getElementById('toggleLideranca');
if (toggleLiderancaBtn) {
  toggleLiderancaBtn.addEventListener('click', () => {
    const section = document.getElementById('submissoesLiderancaAdmin');
    // alterna visibilidade do container
    section.style.display = section.style.display === 'block' ? 'none' : 'block';
    // carrega dados apenas quando abrir
    if (section.style.display === 'block' && typeof carregarSubmissoesLiderancaAdmin === 'function') {
      carregarSubmissoesLiderancaAdmin();
    }
  });
}


// ————— Acordeão no Painel Administrativo —————
const adminPanel = document.getElementById('controlePainel');
if (adminPanel) {
  // Para cada <h2> dentro do painel...
  adminPanel.querySelectorAll('h2').forEach(header => {
    // Cria o efeito de cursor
    header.style.cursor = 'pointer';
    // Ao clicar, alterna a classe 'active' e mostra/esconde o conteúdo até o próximo <h2>
    header.addEventListener('click', () => {
      header.classList.toggle('active');
      let el = header.nextElementSibling;
      const mostrar = header.classList.contains('active');
      // Enquanto não chegar ao próximo <h2>, exibe ou oculta
      while (el && el.tagName !== 'H2') {
        el.style.display = mostrar ? 'block' : 'none';
        el = el.nextElementSibling;
      }
      // ← AQUI: ao abrir "Avaliações e Notas", repovoa o select
      if (header.textContent.trim() === 'Avaliações e Notas' && mostrar) {
        if (typeof populateSelectProvaDisc === 'function') {
          populateSelectProvaDisc();
        }
      }

      // ao abrir "Submissões da Liderança", carrega os dados
      if (header.textContent.trim() === 'Submissões da Liderança' && mostrar) {
        if (typeof carregarSubmissoesLiderancaAdmin === 'function') {
          carregarSubmissoesLiderancaAdmin();
        }
        if (typeof carregarPelotoesLider === 'function') {
      carregarPelotoesLider();
      // reseta o segundo select
      document.getElementById('selectQRALider')
              .innerHTML = '<option value="">Selecione</option>';
    }
      }

    });
  });
  // ─── Accordion interno para Submissões da Liderança ───
  const submissoes = document.getElementById('submissoesLiderancaAdmin');
  if (submissoes) {
    submissoes.querySelectorAll('h3').forEach(title => {
      title.style.cursor = 'pointer';
      title.addEventListener('click', () => {
        title.classList.toggle('active');
        const content = title.nextElementSibling;
        content.style.display = title.classList.contains('active')
          ? 'block'
          : 'none';
      });
    });
  }

}
// ——————————————————————————————

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function logout() {
  localStorage.removeItem('nomeUsuario');
  localStorage.removeItem('emailUsuario');
  window.location.href = "login.html";
}



function abrirFormulario() {
  document.getElementById('popupContato').style.display = 'flex';
}

function fecharFormulario() {
  document.getElementById('popupContato').style.display = 'none';
}

function enviarEmail() {
  const nome = document.getElementById('contatoNome').value;
  const email = document.getElementById('contatoEmail').value;
  const mensagem = document.getElementById('contatoMensagem').value;

  const assunto = encodeURIComponent("Solicitação de Aluno - EFAG");
  const corpo = encodeURIComponent(`Nome: ${nome}\nEmail: ${email}\n\nMensagem:\n${mensagem}`);

 window.location.href = `mailto:efaggcm@guarulhos.sp.gov.br?subject=${assunto}&body=${corpo}`;

  fecharFormulario();
}
const comunicados = [
  {
    titulo: "Início do Curso de Formação",
    data: "21/04/2025",
    html: `
      <p>Comunicamos que em <strong>maio de 2025</strong> terá início o tão esperado <strong>Curso de Formação da Guarda Municipal</strong> na EFAG.</p>
      <p>Desejamos uma jornada de aprendizado, comprometimento e sucesso a todos os alunos.</p>
      <div style="text-align: center; margin-top: 20px;">
        <img src="comunicados.img.png" alt="Curso de Formação GCM EFAG" style="max-width: 80%; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);" />
      </div>
    `
  }
];

async function carregarComunicados() {
  const container = document.getElementById('listaComunicados');
  container.innerHTML = '';
  const snapshot = await db.collection('comunicados')
    .orderBy('data', 'desc')
    .get();
  snapshot.forEach((doc, index) => {
    const c = doc.data();
    const box = document.createElement('div');
    box.className = 'comunicado-box';
    box.innerHTML = `
      <h3>
        <span>${c.titulo}</span>
        <i class="fas fa-chevron-right toggle-icon"></i>
      </h3>
      <p class="com-data"><i class="fas fa-calendar-alt"></i> ${c.data}</p>
      <div class="com-conteudo" style="display:none;">${c.html}</div>
    `;
    // toggle expand/collapse
    box.querySelector('h3').onclick = () => {
      box.classList.toggle('expanded');
      const conteudo = box.querySelector('.com-conteudo');
      conteudo.style.display = conteudo.style.display === 'block' ? 'none' : 'block';
    };
    container.appendChild(box);
  });
}

// evita recarregar várias vezes
let avisosLoaded = false;

async function carregarAvisos() {
  const userEmail = localStorage.getItem('emailUsuario');
  if (!userEmail) return;

  const snapshot = await db.collection("usuarios")
    .doc(userEmail)
    .collection("avisos")
    .orderBy("dataEnviado", "desc")
    .get();

  if (snapshot.empty) return;

  // monta o container na aba Comunicados
  const container = document.createElement("div");
  container.innerHTML = `<h3 style="margin-top:20px;">🔔 Avisos Recebidos</h3>`;

  snapshot.forEach(docAviso => {
    const { mensagem, dataEnviado } = docAviso.data();
    const dt = dataEnviado.toDate().toLocaleString("pt-BR");
    container.innerHTML += `
      <div style="border:1px solid #ddd; padding:10px; margin-bottom:8px; border-radius:6px;">
        <p>${mensagem}</p>
        <small style="color:#666;">Enviado em: ${dt}</small>
      </div>
    `;
  });

  // insere **antes** da lista oficial de comunicados
  const lista = document.getElementById("listaComunicados");
  lista.parentNode.insertBefore(container, lista);
}


function atualizarStatusBoletim() {
  document.querySelectorAll('.card-boletim').forEach(card => {
    const notaEl = card.querySelector('.detalhes p:nth-child(1) strong');
    const statusEl = card.querySelector('.status');

    if (!notaEl || !statusEl) return;

    const notaTexto = notaEl.textContent.trim();
    const nota = parseFloat(notaTexto.replace('%', '').replace(',', '.'));

    statusEl.classList.remove('aprovado', 'reprovado', 'analise');

    if (isNaN(nota)) {
      statusEl.textContent = "Situação: Em análise";
      statusEl.classList.add('analise');
    } else if (nota >= 70) {
      statusEl.textContent = "Situação: Aprovado";
      statusEl.classList.add('aprovado');
    } else {
      statusEl.textContent = "Situação: Reprovado";
      statusEl.classList.add('reprovado');
    }
  });
}

function carregarBoletim() {
  // ① obtém dinamicamente e ordena alfabeticamente as disciplinas carregadas do Firestore
  const nomesOrdenados = Object
    .keys(dadosDisciplinas)
    .sort((a, b) => a.localeCompare(b, 'pt', { ignorePunctuation: true }));

  const container = document.getElementById("boletimCards");
  container.innerHTML = ""; // limpa o boletim

  // ② gera um card para cada disciplina dinâmica
  nomesOrdenados.forEach(nome => {
    const card = document.createElement("div");
    card.className = "card-boletim";
    card.innerHTML = `
      <h3>${nome}</h3>
      <div class="detalhes">
        <p>Nota: <strong>—</strong></p>
        <p>Frequência: <strong>—</strong></p>
        <p class="status analise">Situação: Em análise</p>
      </div>
    `;
    container.appendChild(card);
  });
}


setTimeout(atualizarStatusBoletim, 100);
function baixarLinksPDF() {
  const area = document.getElementById('linksImportantes');
  if (!area) {
    alert("Seção não encontrada.");
    return;
  }

  const clone = area.cloneNode(true);
  clone.style.visibility = 'hidden';
  clone.style.position = 'absolute';
  clone.style.top = '0';
  clone.style.left = '0';
  clone.style.width = '900px';
  clone.style.padding = '20px';
  clone.style.background = 'white';
  document.body.appendChild(clone);

  const opt = {
    margin: 0.5,
    filename: `Links_EFAG_${new Date().toLocaleDateString('pt-BR')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(clone).save().then(() => {
    document.body.removeChild(clone);
  });
}

async function confirmarPresenca() {
  // ── 1. data obrigatória ──
  const dataSelecionada = document.getElementById('dataPresenca').value;
  if (!dataSelecionada) {
    mostrarAviso("⚠️ Por favor, selecione a data da lista.");
    return;
  }

  // ── 2. validações de presença vs justificativa ──
  const checkboxes = document.querySelectorAll('.presenca');
  const justificativas = document.querySelectorAll('.justificativa');
  let valido = true;
  let todosPreenchidos = true;

  checkboxes.forEach((cb, i) => {
    const just = justificativas[i];
    if (cb.checked && just.value !== "") valido = false;
    if (!cb.checked && just.value === "") todosPreenchidos = false;
  });

  if (!valido) {
    mostrarAviso("⚠️ Escolha apenas presença *ou* justificativa por aluno.");
    return;
  }
  if (!todosPreenchidos) {
    mostrarAviso("⚠️ Registre presença ou justificativa para *todos* os alunos.");
    return;
  }

  // ── 3. monta array de presenças ──
  const presencas = [];
  const qra = document.getElementById('qraAluno').value;
  document.querySelectorAll('#lideranca table tbody tr')
    .forEach(tr => {
      const qra = tr.cells[0].textContent.trim();
      const presente = tr.querySelector('input.presenca').checked;
      const justificativa = presente
        ? ''
        : tr.querySelector('select.justificativa').value;
      presencas.push({ qra, presente, justificativa });
    });

  // ── 4. envia para o Firestore com a data selecionada ──
  const pelotao = document.getElementById('pelotaoAluno').value;
  try {
    await db.collection('presencas')
  .add({ date: dataSelecionada, pelotao, qra, presencas });
  } catch (err) {
    console.error('Erro ao salvar presença:', err);
    mostrarAviso("⚠️ Falha ao registrar no servidor.");
    return;
  }

  // ── 5. feedback visual ──
  const btn = document.getElementById('btnPresenca');
  btn.textContent = '✅ Lista Confirmada';
  btn.style.backgroundColor = '#28a745';
  btn.disabled = true;
}


async function enviarRecado() {
  const mensagem = document.getElementById('mensagemRecado').value.trim();
  if (!mensagem) {
    mostrarAviso('Digite uma mensagem para enviar o recado.');
    return;
  }


  // Envio com campo QRA
  const pelotao = document.getElementById('pelotaoAluno').value;
  const qra = document.getElementById('qraAluno').value;
  const date = new Date().toISOString().split('T')[0];
  try {
    await db.collection('recados')
      .add({ date, pelotao, qra, mensagem });
    console.log('📨 Recado salvo no Firestore');
  } catch (err) {
    console.error('Erro ao salvar recado:', err);
  }


  // Feedback original
  const botao = document.getElementById('btnRecado');
  botao.textContent = '📨 Recado Enviado';
  botao.style.backgroundColor = '#28a745';
  botao.disabled = true;
  document.getElementById('mensagemRecado').value = '';
}

async function salvarRelatorio() {
  const texto = document.getElementById('mensagemRelatorio').value.trim();
  if (!texto) {
    mostrarAviso('Digite o conteúdo do relatório antes de salvar.');
    return;
  }

  // Envio com campo QRA
  const pelotao = document.getElementById('pelotaoAluno').value;
  const qra = document.getElementById('qraAluno').value;
  const date = new Date().toISOString().split('T')[0];
  try {
    await db.collection('relatorios')
      .add({ date, pelotao, qra, texto });
    console.log('✅ Relatório salvo no Firestore');
  } catch (err) {
    console.error('Erro ao salvar relatório:', err);
  }


  // Feedback original
  const botao = document.getElementById('btnRelatorio');
  botao.textContent = '✅ Relatório Salvo';
  botao.style.backgroundColor = '#28a745';
  botao.disabled = true;
  document.getElementById('mensagemRelatorio').value = '';
}

function toggleExportMenu() {
  const menu = document.getElementById("menuExportar");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}

function mostrarAviso(mensagem) {
  const aviso = document.getElementById("notificacao");
  aviso.style.color = "#dc3545"; // vermelho estilo Bootstrap
  aviso.innerHTML = mensagem; // Removido ✅ fixo
  aviso.style.display = "block";
  aviso.style.opacity = "1";

  setTimeout(() => {
    aviso.style.opacity = "0";
  }, 3000);

  setTimeout(() => {
    aviso.style.display = "none";
    aviso.style.opacity = "1";
  }, 4000);
}
let chaveAlunoEditando = null;
function editarAluno(chave) {
  const dados = JSON.parse(localStorage.getItem(chave));
  if (!dados) return;

  chaveAlunoEditando = chave; // salva a chave atual para sabermos se precisa apagar depois

  document.getElementById('qraAluno').value = dados.qraAluno || '';
  document.getElementById('cfAluno').value = dados.cfAluno || '';
  document.getElementById('reAluno').value = dados.reAluno || '';
  document.getElementById('pelotaoAluno').value = dados.pelotaoAluno || '';
  // Preenche o campo de e-mail (Firestore → email; fallback para emailAluno)
document.getElementById('emailAluno').value =
  dados.email    ?? dados.emailAluno ?? '';
  document.getElementById('cursoAluno').value = dados.cursoAluno || '';
  document.getElementById('nomeCompleto').value = dados.nomeCompleto || '';
  document.getElementById('cpfAluno').value = dados.cpfAluno || '';
  // pega a string original
  let dataStr = dados.dataNascimento || '';

  // se vier com barras, converte para traços
  if (dataStr.includes('/')) {
    const partes = dataStr.split('/');
    if (partes[0].length === 4) {
      // formato AAAA/MM/DD → AAAA-MM-DD
      dataStr = partes.join('-');
    } else {
      // formato DD/MM/AAAA → AAAA-MM-DD
      dataStr = [partes[2], partes[1], partes[0]].join('-');
    }
  }

  // atribui ao date input
  document.getElementById('dataNascimento').value = dataStr;

  document.getElementById('enderecoAluno').value = dados.enderecoAluno || '';
  document.getElementById('telefoneAluno').value = dados.telefoneAluno || '';
  document.getElementById('sangueAluno').value = dados.sangueAluno || '';

  // Ativa os campos para edição
  const ids = [
    'qraAluno', 'cfAluno', 'reAluno', 'pelotaoAluno',
    'emailAluno', 'cursoAluno', 'nomeCompleto',
    'cpfAluno', 'dataNascimento', 'enderecoAluno',
    'telefoneAluno', 'sangueAluno'
  ];
  ids.forEach(id => {
    const campo = document.getElementById(id);
    if (campo) {
      campo.disabled = false;
      campo.style.backgroundColor = "#ffffff";
    }
  });

  // Mostra botão salvar e oculta botão editar
  document.getElementById('btnEditar').style.display = 'none';
  document.getElementById('btnSalvar').style.display = 'inline-block';
}





function abrirModalLink(tipo) {
  const titulo = document.getElementById("modalLinksTitulo");
  const lista = document.getElementById("modalLinksLista");
  lista.innerHTML = "";

  let links = [];

  if (tipo === 'documentos') {
    titulo.textContent = '📚 Documentos Oficiais';
    links = [
      { nome: "Portarias Oficiais", url: "https://portaldoservidor.guarulhos.sp.gov.br/servicos.php?serv=670" },
      { nome: "Procedimentos Operacionais Padrão (POP)", url: "https://portaldoservidor.guarulhos.sp.gov.br/servicos.php?serv=615" },
      { nome: "Legislação Municipal", url: "https://www.guarulhos.sp.gov.br/legislacao-municipal" }
    ];
  } else if (tipo === 'prefeitura') {
    titulo.textContent = '🏛️ Links da Prefeitura';
    links = [
      { nome: "Site da Prefeitura", url: "https://www.guarulhos.sp.gov.br/" },
      { nome: "Portal do Servidor", url: "https://portaldoservidor.guarulhos.sp.gov.br/" },
      { nome: "Webmail", url: "https://mail.guarulhos.sp.gov.br/static/login/" },
      { nome: "SEI", url: "https://sei.guarulhos.sp.gov.br/sip/web/login.php?sigla_orgao_sistema=PMG&sigla_sistema=SEI" }
    ];
  } else if (tipo === 'comunicacao') {
    titulo.textContent = '📞 Canais de Comunicação';
    links = [
      { nome: "Secretária de Gestão - (11) 2423-7417", url: "https://www.guarulhos.sp.gov.br/transparencia/fale-conosco" },
      { nome: "Email da Prefeitura", url: "https://portaldoservidor.guarulhos.sp.gov.br/contato.php" }
    ];
  }

  links.forEach(link => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="${link.url}" target="_blank" style="color:#1d3557; text-decoration:none;">${link.nome}</a>`;
    lista.appendChild(li);
  });

  document.getElementById("modalLinks").style.display = "flex";
}

function fecharModalLink() {
  document.getElementById("modalLinks").style.display = "none";
}

async function exportarBoletimImagem() {
  const boletim = document.getElementById('boletimCards');
  if (!boletim || boletim.innerHTML.trim() === '') {
    carregarBoletim(); // Garante conteúdo antes de exportar
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  const botaoExportar = document.querySelector('.dropdown-export');
  const menuExportar = document.getElementById('menuExportar');
  const filtros = document.getElementById('filtrosBoletim');

  if (botaoExportar) botaoExportar.style.display = 'none';
  if (menuExportar) menuExportar.style.display = 'none';
  if (filtros) filtros.style.display = 'none';

  const clone = boletim.cloneNode(true);
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '1200px';
  container.style.background = 'white';
  container.style.padding = '20px';
  container.style.zIndex = '-1';
  container.style.visibility = 'hidden';

  container.appendChild(clone);
  document.body.appendChild(container);

  await new Promise(resolve => setTimeout(resolve, 600));

  const canvas = await html2canvas(container, { scale: 2, useCORS: true });
  const imageData = canvas.toDataURL("image/png");

  const link = document.createElement("a");
  link.href = imageData;
  link.download = `Boletim_EFAG_${new Date().toLocaleDateString('pt-BR')}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  document.body.removeChild(container);

  if (botaoExportar) botaoExportar.style.display = 'inline-block';
  if (filtros) filtros.style.display = 'flex';
}


function renderAccordionFaltas() {
  const container = document.getElementById("accordion-faltas");
  for (const grupo in faltasDisciplinar) {
    const divGrupo = document.createElement("div");

    const titulo = document.createElement("div");
    titulo.className = "accordion-titulo";
    titulo.textContent = grupo;
    titulo.addEventListener("click", () => {
      conteudo.style.display = conteudo.style.display === "block" ? "none" : "block";
    });

    const conteudo = document.createElement("div");
    conteudo.className = "accordion-conteudo";


    divGrupo.appendChild(titulo);
    divGrupo.appendChild(conteudo);
    container.appendChild(divGrupo);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderAccordionFaltas();
});
// variável que guarda o pelotão atualmente exibido (ou null se nenhum)
let pelotaoAtivo = null;
document.getElementById('filterPelotaoGrade').addEventListener('change', e => {
  gradeFilterPelotao = e.target.value;  // "" para todos, ou "01", "02", etc.

  // Se já houver um dia selecionado, reaplica o clique para atualizar a lista
  const selected = document.querySelector('.data-selecionada');
  if (selected) selected.click();
});

function abrirGestaoAlunos() {
  const pelotoesContainer = document.getElementById('pelotoesContainer');
  pelotoesContainer.innerHTML = '';

  for (let i = 1; i <= 5; i++) {
    const card = document.createElement('div');
    card.className = 'disciplina-card';
    card.textContent = `Pelotão ${i.toString().padStart(2, '0')}`;
    card.onclick = () => {
      const alunosContainer = document.getElementById('alunosContainer');
      // se clicar no mesmo pelotão que já está ativo, contrai (limpa)
      if (pelotaoAtivo === i) {
        alunosContainer.innerHTML = '';
        pelotaoAtivo = null;
      } else {
        // senão, renderiza a lista e marca como ativo
        listarAlunosPorPelotao(i);
        pelotaoAtivo = i;
      }
    };
    pelotoesContainer.appendChild(card);
  }

  document.getElementById('alunosContainer').innerHTML = '';
}

async function listarAlunosPorPelotao(numeroPelotao) {
  const alunosContainer = document.getElementById('alunosContainer');
  alunosContainer.innerHTML = '';

  try {
    // 1) Busca todos os usuários daquele pelotão no Firestore
    const snapshot = await db
      .collection('usuarios')
      .where('pelotaoAluno', '==', numeroPelotao.toString().padStart(2,'0'))
      .get();

    if (snapshot.empty) {
      alunosContainer.innerHTML = `
        <p style="color: #777;">
          Nenhum aluno encontrado no Pelotão ${numeroPelotao.toString().padStart(2,'0')}.
        </p>`;
      return;
    }

    // 2) Ordena por QRA e cria os cards
    snapshot.docs
      .sort((a, b) =>
        a.data().qraAluno.localeCompare(b.data().qraAluno, 'pt', {ignorePunctuation: true})
      )
      .forEach(doc => {
        const d = doc.data();
        const card = document.createElement('div');
        card.className = 'card-gestao';
        card.innerHTML = `
          <strong>${d.qraAluno}</strong><br>
          <small>${d.cfAluno || '-'}</small><br>
          <small>Pelotão: ${d.pelotaoAluno}</small>
        `;
        card.onclick = () => abrirModalAluno(d, doc.id);
        alunosContainer.appendChild(card);
      });
  } catch (err) {
    console.error('Erro ao listar alunos:', err);
  }
}


let alunoSelecionado = null;
let chaveAlunoSelecionado = null;

function abrirModalAluno(aluno, chave) {
  alunoSelecionado = aluno;
  chaveAlunoSelecionado = chave;

  // Preenche visualização
  const visualizacao = document.getElementById('modalVisualizacaoAluno');
  visualizacao.innerHTML = `
    <p><strong>Nome Completo:</strong> ${aluno.nomeCompleto || '-'}</p>
    <p><strong>QRA:</strong> ${aluno.qraAluno || '-'}</p>
    <p><strong>CF:</strong> ${aluno.cfAluno || '-'}</p>
    <p><strong>RE:</strong> ${aluno.reAluno || '-'}</p>
    <p><strong>Pelotão:</strong> ${aluno.pelotaoAluno || '-'}</p>
    <p><strong>Email:</strong> ${aluno.email || '-'}</p>
    <p><strong>Curso:</strong> ${aluno.cursoAluno || '-'}</p>
    <p><strong>CPF:</strong> ${aluno.cpfAluno || '-'}</p>
    <p><strong>Data de Nascimento:</strong> ${aluno.dataNascimento || '-'}</p>
    <p><strong>Endereço:</strong> ${aluno.enderecoAluno || '-'}</p>
    <p><strong>Telefone:</strong> ${aluno.telefoneAluno || '-'}</p>
    <p><strong>Tipo Sanguíneo:</strong> ${aluno.sangueAluno || '-'}</p>
    <div style="margin-top:20px;">
      <button id="btnExcluirAluno" style="background-color:#dc3545; color:#fff; padding:8px 12px; border:none; border-radius:4px; cursor:pointer;">
        Excluir
      </button>
    </div>
  `;

  // Ajusta visibilidade de seções
  document.getElementById('modalVisualizacaoAluno').style.display = 'block';
  document.getElementById('modalEdicaoAluno').style.display = 'none';
  document.getElementById('btnEditarAluno').style.display = 'inline-block';
  document.getElementById('btnSalvarAluno').style.display = 'none';

  // Vincula o botão de excluir
  document.getElementById('btnExcluirAluno').onclick = () => excluirAluno();

  // Abre o modal
  const modal = document.getElementById('modalAluno');
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('show'), 10);
}

function fecharModalAluno() {
  const modal = document.getElementById('modalAluno');
  modal.classList.remove('show');
  setTimeout(() => modal.style.display = 'none', 200);
}

function entrarModoEdicao() {
  if (!alunoSelecionado) return;

  document.getElementById('editNome').value = alunoSelecionado.nomeCompleto || '';
  document.getElementById('editQra').value = alunoSelecionado.qraAluno || '';
  document.getElementById('editCf').value = alunoSelecionado.cfAluno || '';
  document.getElementById('editRe').value = alunoSelecionado.reAluno || '';
  document.getElementById('editPelotao').value = alunoSelecionado.pelotaoAluno || '';
  document.getElementById('editEmail').value = alunoSelecionado.email || '';
  document.getElementById('editEmail').readOnly = true;
  document.getElementById('editCurso').value = alunoSelecionado.cursoAluno || '';
  document.getElementById('editCpf').value = alunoSelecionado.cpfAluno || '';
  document.getElementById('editNascimento').value = alunoSelecionado.dataNascimento || '';
  document.getElementById('editEndereco').value = alunoSelecionado.enderecoAluno || '';
  document.getElementById('editTelefone').value = alunoSelecionado.telefoneAluno || '';
  document.getElementById('editSangue').value = alunoSelecionado.sangueAluno || '';

  document.getElementById('modalVisualizacaoAluno').style.display = 'none';
  document.getElementById('modalEdicaoAluno').style.display = 'block';
  document.getElementById('btnEditarAluno').style.display = 'none';
  document.getElementById('btnSalvarAluno').style.display = 'inline-block';

  // Atualiza o título ao digitar o nome
  document.getElementById('editNome').addEventListener('input', e => {
    document.getElementById('modalTituloAluno').textContent = e.target.value || 'Informações do Aluno';
  });

  // Atualiza pelotão em tempo real (opcional, se quiser usar depois)
  document.getElementById('editPelotao').addEventListener('input', e => {
    alunoSelecionado.pelotaoAluno = e.target.value;
  });

}

async function salvarEdicaoAluno() {
  // Pega o e-mail que está no campo de edição
  const emailAluno = document.getElementById('editEmail').value;
  console.log("Tentando salvar para:", emailAluno);

  try {
    // 1) Atualiza no Firestore
    const docRef = db.collection("usuarios").doc(emailAluno);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      console.error("Documento do aluno não encontrado!");
      return;
    }

    const dadosExistentes = docSnap.data();
    const dadosAtualizados = {
      ...dadosExistentes,
      nomeCompleto: document.getElementById('editNome').value || '',
      qraAluno: document.getElementById('editQra').value || '',
      cfAluno: document.getElementById('editCf').value || '',
      reAluno: document.getElementById('editRe').value || '',
      pelotaoAluno: document.getElementById('editPelotao').value.padStart(2, '0') || '',
      email: document.getElementById('editEmail').value || '',
      cursoAluno: document.getElementById('editCurso').value || 'Formação de Guardas Municipais',
      cpfAluno: document.getElementById('editCpf').value || '',
      dataNascimento: document.getElementById('editNascimento').value || '',
      enderecoAluno: document.getElementById('editEndereco').value || '',
      telefoneAluno: document.getElementById('editTelefone').value || '',
      sangueAluno: document.getElementById('editSangue').value || ''
    };
    await docRef.set(dadosAtualizados, { merge: true });

    Swal.fire({
      icon: 'success',
      title: 'Sucesso',
      text: 'As informações do aluno foram atualizadas!'
    });

    // 2) Sincroniza também no localStorage
    const dadosLocais = {
      nomeCompleto: dadosAtualizados.nomeCompleto,
      qraAluno: dadosAtualizados.qraAluno,
      cfAluno: dadosAtualizados.cfAluno,
      reAluno: dadosAtualizados.reAluno,
      pelotaoAluno: dadosAtualizados.pelotaoAluno,
      emailAluno: dadosAtualizados.email,
      cursoAluno: dadosAtualizados.cursoAluno,
      cpfAluno: dadosAtualizados.cpfAluno,
      dataNascimento: dadosAtualizados.dataNascimento,
      enderecoAluno: dadosAtualizados.enderecoAluno,
      telefoneAluno: dadosAtualizados.telefoneAluno,
      sangueAluno: dadosAtualizados.sangueAluno
    };
    localStorage.setItem(chaveAlunoSelecionado, JSON.stringify(dadosLocais));

    // 3) Re-renderiza os cards do pelotão editado
    const pelotaoNum = parseInt(dadosLocais.pelotaoAluno, 10);
    listarAlunosPorPelotao(pelotaoNum);  // :contentReference[oaicite:0]{index=0}&#8203;:contentReference[oaicite:1]{index=1}

    // 4) Fecha o modal de edição
    fecharModalAluno();
    // 5) Atualiza a aba ‘Informações’ com os novos dados
    atualizarInfoPrincipal(dadosLocais);

  } catch (error) {
    console.error("Erro ao salvar no Firestore:", error);
    Swal.fire({
      icon: 'error',
      title: 'Erro',
      text: 'Não foi possível salvar no banco de dados.'
    });
  }
}

// script.js
async function excluirAluno() {
  const res = await Swal.fire({
    title: 'Tem certeza?',
    text: "Você realmente quer excluir este aluno?",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sim, excluir!'
  });
  if (!res.isConfirmed) return;

  try {
    // Deleta do Firestore pelo e-mail salvo em alunoSelecionado
    await db.collection('usuarios')
      .doc(alunoSelecionado.emailAluno)
      .delete();

    // Deleta do localStorage pela chave salva
    localStorage.removeItem(chaveAlunoSelecionado);

    // Atualiza interface e fecha modal
    atualizarListaAlunos();
    fecharModalAluno();

    Swal.fire('Excluído!', 'O aluno foi removido do sistema.', 'success');
  } catch (err) {
    console.error('Erro ao excluir:', err);
    Swal.fire('Falha na exclusão',
      'Não foi possível remover o aluno: ' + err.message,
      'error');
  }
}

function atualizarInfoPrincipal(aluno) {
  document.getElementById('qraAluno').value = aluno.qraAluno || '';
  document.getElementById('cfAluno').value = aluno.cfAluno || '';
  document.getElementById('reAluno').value = aluno.reAluno || '';
  document.getElementById('pelotaoAluno').value = aluno.pelotaoAluno || '';
  document.getElementById('emailAluno').value = aluno.emailAluno || '';
  document.getElementById('cursoAluno').value = aluno.cursoAluno || '';
  document.getElementById('nomeCompleto').value = aluno.nomeCompleto || '';
  document.getElementById('cpfAluno').value = aluno.cpfAluno || '';
  document.getElementById('dataNascimento').value = aluno.dataNascimento || '';
  document.getElementById('enderecoAluno').value = aluno.enderecoAluno || '';
  document.getElementById('telefoneAluno').value = aluno.telefoneAluno || '';
  document.getElementById('sangueAluno').value = aluno.sangueAluno || '';
}
function habilitarInsercao() {
  const user = localStorage.getItem('nomeUsuario');
  const dadosSalvos = localStorage.getItem(`dados_${user}`);

  if (dadosSalvos) {
    // Já tem dados preenchidos, bloqueia novamente
    mostrarAviso('⚠️ Você já inseriu suas informações. Não é possível editar.');
    return;
  }

  // Permitir preenchimento apenas se não existir dados salvos
  const ids = [
    'qraAluno', 'cfAluno', 'reAluno', 'pelotaoAluno',
    'emailAluno', 'nomeCompleto',
    'cpfAluno', 'dataNascimento', 'enderecoAluno',
    'telefoneAluno', 'sangueAluno'
  ];
  ids.forEach(id => {
    const campo = document.getElementById(id);
    if (campo) {
      campo.disabled = false;
      campo.style.backgroundColor = "#ffffff"; // libera para preencher
    }
  });

  document.getElementById('btnEditar').style.display = 'none';
  document.getElementById('btnSalvar').style.display = 'inline-block';
}
async function lancarProva() {
  const disciplina = document.getElementById('disciplinaProva').value.trim();
  const pelotao = document.getElementById('pelotaoProva').value.trim();
  const link = document.getElementById('linkProva').value.trim();

  if (!disciplina || !pelotao || !link) {
    Swal.fire("Atenção", "Preencha todos os campos!", "warning");
    return;
  }

  try {
    await db.collection("provas").add({ disciplina, pelotao, link });
    Swal.fire("Sucesso", "Prova lançada com sucesso!", "success");
    document.getElementById('disciplinaProva').value = '';
    document.getElementById('pelotaoProva').value = '';
    document.getElementById('linkProva').value = '';
  } catch (e) {
    Swal.fire("Erro", "Não foi possível lançar a prova.", "error");
    console.error(e);
  }
}
async function carregarProvas() {
  const provasGrid = document.getElementById("provasGrid");
  provasGrid.innerHTML = "";

  const pelotaoAluno = document.getElementById("pelotaoAluno").value.padStart(2, "0");

  try {
    const snapshot = await db.collection("provas")
      .where("pelotao", "==", pelotaoAluno)
      .get();

    if (snapshot.empty) {
      provasGrid.innerHTML = "<p>Nenhuma prova disponível para seu pelotão.</p>";
      return;
    }

    snapshot.forEach(doc => {
      const { disciplina, link, encerrada } = doc.data();
      const card = document.createElement("div");
      card.className = "disciplina-card";

      if (encerrada) {
        card.innerHTML = `
          <div style="cursor: not-allowed;" onclick="Swal.fire('⚠️ Prova encerrada', 'Esta prova não está mais disponível.', 'info')">
            ${disciplina} <br><small style="color: red;">Prova encerrada</small>
          </div>
        `;
      } else {
        card.innerHTML = `
          <a href="${link}" target="_blank">${disciplina}</a>
        `;
      }

      provasGrid.appendChild(card);
    });
  } catch (error) {
    console.error("Erro ao carregar provas:", error);
  }
}

async function encerrarProva() {
  const disciplina = document.getElementById('disciplinaProva').value.trim();
  const pelotao = document.getElementById('pelotaoProva').value.trim();

  if (!disciplina || !pelotao) {
    Swal.fire("Atenção", "Preencha disciplina e pelotão para encerrar.", "warning");
    return;
  }

  try {
    const query = await db.collection("provas")
      .where("disciplina", "==", disciplina)
      .where("pelotao", "==", pelotao)
      .get();

    if (query.empty) {
      Swal.fire("Erro", "Prova não encontrada para encerrar.", "error");
      return;
    }

    const docId = query.docs[0].id;
    await db.collection("provas").doc(docId).update({ encerrada: true });

    Swal.fire("Encerrada", "A prova foi encerrada com sucesso!", "success");
  } catch (e) {
    console.error(e);
    Swal.fire("Erro", "Algo deu errado ao encerrar a prova.", "error");
  }
}
async function carregarProvasParaEncerrar() {
  const pelotao = document.getElementById('filtroPelotaoEncerrar').value;
  const selectDisc = document.getElementById('filtroDisciplinaEncerrar');
  selectDisc.innerHTML = '<option value="">Carregando...</option>';

  try {
    const snapshot = await db.collection("provas")
      .where("pelotao", "==", pelotao)
      .get();

    if (snapshot.empty) {
      selectDisc.innerHTML = '<option value="">Nenhuma prova encontrada</option>';
      return;
    }

    let opcoes = '<option value="">Selecione a disciplina</option>';
    snapshot.forEach(doc => {
      const dados = doc.data();
      if (!dados.encerrada) {
        opcoes += `<option value="${doc.id}">${dados.disciplina}</option>`;
      }
    });

    selectDisc.innerHTML = opcoes || '<option value="">Nenhuma prova ativa</option>';
  } catch (e) {
    console.error("Erro ao carregar provas:", e);
    selectDisc.innerHTML = '<option value="">Erro ao carregar</option>';
  }
}


async function encerrarProvaSelecionada() {
  const provaId = document.getElementById('filtroDisciplinaEncerrar').value;
  if (!provaId) {
    Swal.fire("Atenção", "Selecione uma disciplina válida.", "warning");
    return;
  }

  try {
    await db.collection("provas").doc(provaId).update({ encerrada: true });
    Swal.fire("Encerrada", "A prova foi encerrada com sucesso!", "success");
    carregarProvasParaEncerrar(); // atualiza a lista
  } catch (e) {
    console.error("Erro ao encerrar prova:", e);
    Swal.fire("Erro", "Não foi possível encerrar a prova.", "error");
  }
}
async function lancarNotaPorQRA() {
  const selectQRA    = document.getElementById("selectQRAAluno");
  const qra          = selectQRA.value;
  const disciplina   = document.getElementById("disciplinaSelect").value;
  const nota         = parseFloat(document.getElementById("notaValor").value);
  const frequencia   = parseInt(document.getElementById("frequenciaValor").value);

  // pega diretamente o atributo data-email da option selecionada
  const email = selectQRA.options[selectQRA.selectedIndex].getAttribute("data-email");

  if (!qra || !disciplina || isNaN(nota) || isNaN(frequencia) || !email) {
    Swal.fire("Campos incompletos", "Preencha todos os campos corretamente.", "warning");
    return;
  }

  try {
    const ref = db.collection("usuarios").doc(email);
    await ref.set({
      boletim: {
        [disciplina]: { nota, frequencia }
      }
    }, { merge: true });

    Swal.fire("Sucesso!", "Nota lançada com sucesso!", "success");
  } catch (err) {
    console.error("Erro ao lançar nota:", err);
    Swal.fire("Erro", "Não foi possível salvar a nota.", "error");
  }
}

async function carregarBoletim() {
  const email = localStorage.getItem('emailUsuario');
  const container = document.getElementById('notas');
  container.innerHTML = "<h2>Boletim</h2>"; // limpa e reinicia

  const ref = db.collection("usuarios").doc(email);
  const snap = await ref.get();

  if (snap.exists && snap.data().boletim) {
    const boletim = snap.data().boletim;

    for (let disciplina in boletim) {
      const { nota, frequencia } = boletim[disciplina];

      const card = document.createElement('div');
      card.className = 'card-boletim';
      card.innerHTML = `
        <h3>${disciplina}</h3>
        <div class="detalhes">
          <p>Nota: ${nota}</p>
          <p>Frequência: ${frequencia}%</p>
          <p class="status ${nota >= 6 && frequencia >= 75 ? 'aprovado' : 'reprovado'}">
            ${nota >= 6 && frequencia >= 75 ? 'Aprovado' : 'Reprovado'}
          </p>
        </div>
      `;
      container.appendChild(card);
    }
  } else {
    container.innerHTML += "<p>Sem notas lançadas ainda.</p>";
  }
}
async function carregarQRAsAlunos() {
  const snapshot = await db.collection("usuarios").get();
  const select = document.getElementById("qraSelect");
  if (!select) return;
  select.innerHTML = '<option value="">Selecione um QRA</option>';

  snapshot.forEach(doc => {
    const dados = doc.data();
    if (dados.qraAluno) {
      const opt = document.createElement("option");
      opt.value = dados.qraAluno;
      opt.setAttribute('data-email', doc.id); // salva email no option
      opt.textContent = `${dados.qraAluno} - ${dados.nomeCompleto || ''}`;
      select.appendChild(opt);
    }
  });
}

// Carrega pelotões únicos do Firestore
async function carregarPelotoes() {
  const selectPel = document.getElementById('selectPelotao');
  selectPel.innerHTML = '<option value="">Carregando...</option>';

  try {
    const snapshot = await db.collection("usuarios").get();
    const pelotoesSet = new Set();

    snapshot.forEach(doc => {
      const dados = doc.data();
      if (dados.pelotaoAluno) {
        pelotoesSet.add(dados.pelotaoAluno.padStart(2, '0')); // Ex: 1 → 01
      }
    });

    const pelotoesOrdenados = Array.from(pelotoesSet).sort();
    selectPel.innerHTML = '<option value="">Selecione</option>' +
      pelotoesOrdenados.map(p => `<option value="${p}">${p}º Pelotão</option>`).join('');

  } catch (error) {
    console.error("Erro ao carregar pelotões:", error);
    selectPel.innerHTML = '<option value="">Erro ao carregar</option>';
  }
}

// Carrega QRAs com base no pelotão escolhido
async function carregarQRAsPorPelotao() {
  const pelotao = document.getElementById('selectPelotao').value;
  const selectQRA = document.getElementById('selectQRAAluno');

  if (!pelotao) {
    selectQRA.innerHTML = '<option value="">Selecione um pelotão</option>';
    return;
  }

  selectQRA.innerHTML = '<option value="">Carregando...</option>';

  try {
    const snapshot = await db.collection("usuarios").where("pelotaoAluno", "==", pelotao).get();

    let options = '<option value="">Selecione</option>';
    snapshot.forEach(doc => {
      const dados = doc.data();
      options += `<option 
      value="${dados.qraAluno}"
      data-email="${doc.id}"
    >
      ${dados.qraAluno} - ${dados.nomeCompleto}
    </option>`;
    });

    selectQRA.innerHTML = options;

  } catch (error) {
    console.error("Erro ao carregar QRAs:", error);
    selectQRA.innerHTML = '<option value="">Erro ao carregar</option>';
  }
}
// ─── Para o lançamento de notas (select id="disciplinaSelect") ───
function carregarDisciplinasParaLancamento() {
  const select = document.getElementById("disciplinaSelect");
  if (!select) return;
  select.innerHTML = '<option value="">Selecione uma disciplina</option>';
  Object.keys(dadosDisciplinas).forEach(nome => {
    const opt = document.createElement("option");
    opt.value = nome;
    opt.textContent = nome;
    select.appendChild(opt);
  });
}

// ─── Para a edição de notas (select id="selectDisciplinaNota") ───
function carregarDisciplinasParaEdicao() {
  const select = document.getElementById("selectDisciplinaNota");
  if (!select) return;
  let opcoes = '<option value="">Selecione</option>';
  Object.keys(dadosDisciplinas).forEach(disc => {
    opcoes += `<option value="${disc}">${disc}</option>`;
  });
  select.innerHTML = opcoes;
}

async function carregarNotaFrequenciaAluno() {
  const qra = document.getElementById('selectQRAAluno')?.value;
  const disciplina = document.getElementById('selectDisciplinaNota')?.value;

  if (!qra || !disciplina) return;

  try {
    const docRef = db.collection('notas').doc(qra);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const dados = docSnap.data();
      const info = dados[disciplina] || {};
      document.getElementById('inputNotaAluno').value = info.nota ?? '';
      document.getElementById('inputFrequenciaAluno').value = info.frequencia ?? '';
    } else {
      document.getElementById('inputNotaAluno').value = '';
      document.getElementById('inputFrequenciaAluno').value = '';
    }
  } catch (err) {
    console.error("Erro ao carregar nota/frequência:", err);
  }
}
async function salvarNotaFrequenciaAluno() {
  const selectQRA = document.getElementById('selectQRAAluno');
  const qra = selectQRA.value;
  const email = selectQRA
    .options[selectQRA.selectedIndex]
    .getAttribute('data-email');    // novo
  const disciplina = document.getElementById('selectDisciplinaNota').value;
  const nota = parseFloat(document.getElementById('inputNotaAluno').value);
  const freq = parseInt(document.getElementById('inputFrequenciaAluno').value);

  if (!qra || !disciplina) {
    Swal.fire({ icon: 'warning', title: 'Selecione aluno e disciplina.' });
    return;
  }

  try {
    // 1) Aponta para o doc correto em "usuarios"
    const docRef = db.collection('usuarios').doc(email);
    // 2) Grava no campo "boletim"
    await docRef.set({
      boletim: {
        [disciplina]: {
          nota: isNaN(nota) ? null : nota,
          frequencia: isNaN(freq) ? null : freq
        }
      }
    }, { merge: true });

    Swal.fire({
      icon: 'success',
      title: 'Atualizado com sucesso!',
      text: `Nota e frequência salvas para ${qra}.`,
      confirmButtonColor: '#1d3557'
    });

    // 3) Atualiza a aba Boletim imediatamente
    carregarBoletim();
  } catch (err) {
    console.error('Erro ao salvar nota:', err);
    Swal.fire({ icon: 'error', title: 'Erro ao salvar.' });
  }
}
// função para formatar YYYY-MM-DD → DD/MM/YYYY
function formatarData(iso) {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

// Carrega todos os comunicados no Painel Admin
async function carregarComunicadosAdmin() {
  const container = document.getElementById('listaComunicadosAdmin');
  container.innerHTML = '';
  const snapshot = await db.collection('comunicados')
    .orderBy('data', 'desc')
    .get();
  snapshot.forEach(doc => {
    const c = doc.data();
    const id = doc.id;
    const card = document.createElement('div');
    card.className = 'card-gestao';
    card.innerHTML = `
      <strong>${c.titulo}</strong>
      <small>${c.data}</small>
      <div class="botoes">
        <button class="botao-gestao" onclick="editarComunicado('${id}')">
          <i class="fas fa-pen"></i> Editar
        </button>
        <button class="botao-gestao btn-remover" onclick="excluirComunicado('${id}')">
          <i class="fas fa-trash"></i> Excluir
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

// Adiciona um novo comunicado
async function adicionarComunicado() {
  const titulo = document.getElementById('comTitulo').value.trim();
  const dataIso = document.getElementById('comData').value;
  const html = document.getElementById('comConteudo').value;
  if (!titulo || !dataIso || !html) {
    return Swal.fire({ icon: 'warning', title: 'Preencha todos os campos' });
  }
  await db.collection('comunicados').add({
    titulo,
    data: formatarData(dataIso),
    html
  });
  Swal.fire({ icon: 'success', title: 'Comunicado adicionado!' });
  carregarComunicadosAdmin();
  // limpa form
  document.getElementById('comTitulo').value = '';
  document.getElementById('comData').value = '';
  document.getElementById('comConteudo').value = '';
}

// Prepara o formulário para edição
async function editarComunicado(id) {
  const doc = await db.collection('comunicados').doc(id).get();
  const c = doc.data();
  // pré-enche form
  document.getElementById('comTitulo').value = c.titulo;
  const [d, m, a] = c.data.split('/');
  document.getElementById('comData').value = `${a}-${m}-${d}`;
  document.getElementById('comConteudo').value = c.html;
  // muda o botão para “Salvar Alterações”
  const btn = document.getElementById('btnAddComunicado');
  btn.textContent = 'Salvar Alterações';
  btn.onclick = async () => {
    await db.collection('comunicados').doc(id).update({
      titulo: document.getElementById('comTitulo').value.trim(),
      data: formatarData(document.getElementById('comData').value),
      html: document.getElementById('comConteudo').value
    });
    Swal.fire({ icon: 'success', title: 'Comunicado atualizado!' });
    btn.textContent = 'Adicionar Comunicado';
    btn.onclick = adicionarComunicado;
    carregarComunicadosAdmin();
    document.getElementById('comTitulo').value = '';
    document.getElementById('comData').value = '';
    document.getElementById('comConteudo').value = '';
  };
}

// Exclui um comunicado
async function excluirComunicado(id) {
  const { isConfirmed } = await Swal.fire({
    icon: 'warning',
    title: 'Excluir comunicado?',
    showCancelButton: true,
    confirmButtonText: 'Sim, excluir'
  });
  if (!isConfirmed) return;
  await db.collection('comunicados').doc(id).delete();
  Swal.fire({ icon: 'success', title: 'Comunicado excluído!' });
  carregarComunicadosAdmin();
}

// conector do botão “Adicionar Comunicado” — usando apenas onclick
const btnAdd = document.getElementById('btnAddComunicado');
btnAdd.onclick = adicionarComunicado;


// ao carregar o painel, popula lista de comunicados
document.addEventListener('DOMContentLoaded', () => {
  carregarComunicadosAdmin();
});

async function carregarAlunosParaAvisos() {
  const pel = document.getElementById('selectPelotaoAvisos').value;
  const select = document.getElementById('selectAlunoAvisos');
  select.innerHTML = '<option value="">Selecione um aluno</option>';

  let snapshot;
  if (pel) {
    snapshot = await db.collection('usuarios')
                       .where('pelotaoAluno', '==', pel)
                       .get();
  } else {
    snapshot = await db.collection('usuarios').get();
  }

  snapshot.forEach(doc => {
    const d = doc.data();
    if (d.qraAluno) {
      const opt = document.createElement('option');
      opt.value = doc.id;
      opt.textContent = `${d.qraAluno} – ${d.nomeCompleto || ''}`;
      select.appendChild(opt);
    }
  });
}
async function carregarPelotoesAvisos() {
  const select = document.getElementById('selectPelotaoAvisos');
  select.innerHTML = '<option value="">Todos</option>';
  const snap = await db.collection('usuarios').get();
  const setPel = new Set();

  snap.forEach(doc => {
    const p = doc.data().pelotaoAluno;
    if (p) setPel.add(p.padStart(2, '0'));
  });

  Array.from(setPel).sort().forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = `${p}`;
    select.appendChild(opt);
  });
}


async function enviarAviso() {
  const alunoId = document.getElementById("selectAlunoAvisos").value;
  const mensagem = document.getElementById("textoAviso").value.trim();
  if (!alunoId || !mensagem) {
    Swal.fire({ icon: 'warning', title: 'Preencha aluno e texto do aviso.' });
    return;
  }
  try {
    await db.collection("usuarios")
            .doc(alunoId)
            .collection("avisos")
            .add({
              mensagem,
              dataEnviado: firebase.firestore.FieldValue.serverTimestamp(),
              lido: false 
            }); 
    Swal.fire({ icon: 'success', title: 'Aviso enviado!' });
    document.getElementById("textoAviso").value = '';
  } catch (err) {
    console.error("Erro ao enviar aviso:", err);
    Swal.fire({ icon: 'error', title: 'Falha ao enviar aviso.' });
  }
}

// Busca quantos avisos com lido == false e atualiza o badge
async function updateBadge() {
  const userEmail = localStorage.getItem('emailUsuario');
  if (!userEmail) return;
  try {
    const snapshot = await db
      .collection("usuarios")
      .doc(userEmail)
      .collection("avisos")
      .where("lido", "==", false)
      .get();
    const count = snapshot.size;
    const badge = document.getElementById("badgeAvisos");
    if (!badge) return;
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = "inline-block";
    } else {
      badge.style.display = "none";
    }
  } catch (err) {
    console.error("Erro ao atualizar badge:", err);
  }
}
async function carregarSubmissoesLiderancaAdmin() {
  const presContainer = document.getElementById('listaPresencaAdmin');
  const relContainer = document.getElementById('listaRelatoriosAdmin');
  const recContainer = document.getElementById('listaRecadosAdmin');

  // Helper para agrupar por data (DD/MM/AAAA) dentro de um mês
  function agruparPorDia(items) {
    return items.reduce((acc, item) => {
      const [ano, mes, dia] = item.date.split('-');
      const chave = `${dia}/${mes}/${ano}`;
      acc[chave] = acc[chave] || [];
      acc[chave].push(item);
      return acc;
    }, {});
  }

  // ─── FUNÇÃO GERAL PARA RENDERIZAR UMA COLEÇÃO ───
  async function renderizarColecao(snapCollection, container, tipo) {
    const lista = snapCollection.docs.map(d => ({ id: d.id, ...d.data() }));
    const meses = agruparPorMes(lista); // { '05/2025': [ ... ], ... }

    container.innerHTML = '';
    Object.keys(meses)
      .sort((a, b) => {
        const [mA, aA] = a.split('/').map(Number);
        const [mB, aB] = b.split('/').map(Number);
        return new Date(aB, mB - 1) - new Date(aA, mA - 1);
      })
      .forEach(mesAno => {
        const monthCard = document.createElement('div');
        monthCard.className = 'card-mes';

        const monthHeader = document.createElement('strong');
        monthHeader.textContent = mesAno;
        monthHeader.style.cursor = 'pointer';

        const monthBody = document.createElement('div');
        monthBody.style.display = 'none'; // inicialmente escondido

        // 1) agrupar por dia
        const dias = agruparPorDia(meses[mesAno]); // { '12/05/2025': [...], ... }

        Object.keys(dias)
          .sort((a, b) => {
            // converte DD/MM/AAAA para Date
            const [dA, mA, yA] = a.split('/').map(Number);
            const [dB, mB, yB] = b.split('/').map(Number);
            return new Date(yA, mA - 1, dA) - new Date(yB, mB - 1, dB);
          })
          .forEach(diaStr => {
            const dayHeader = document.createElement('p');
            dayHeader.textContent = diaStr;
            dayHeader.style.margin = '8px 0 4px';
            dayHeader.style.cursor = 'pointer';

            const dayBody = document.createElement('div');
            dayBody.style.display = 'none';
// 2) dentro do dia, agrupar por pelotão com toggle
const gruposPorPelotao = dias[diaStr].reduce((acc, item) => {
  const pel = String(item.pelotao).padStart(2, '0');
  acc[pel] = acc[pel] || [];
  acc[pel].push(item);
  return acc;
}, {});

Object.keys(gruposPorPelotao)
  .sort()
  .forEach(pel => {
    // Cabeçalho do pelotão clicável
    const pelHeader = document.createElement('h4');
    pelHeader.textContent = `Pelotão ${pel}º`;
    pelHeader.style.margin = '4px 0';
    pelHeader.style.cursor = 'pointer';

    // Corpo do pelotão, inicialmente oculto
    const pelBody = document.createElement('div');
    pelBody.style.display = 'none';

    // Preenche pelBody com cada entrada do pelotão
    gruposPorPelotao[pel].forEach(i => {
      const entryDiv = document.createElement('div');
      entryDiv.className = 'entry';
      let html = `<div><strong>${
        tipo === 'presenca'
          ? i.date.split('-').reverse().join('/')
          : ''
      }</strong></div>`;
      if (tipo !== 'presenca') {
        html += `<p><strong>Autor:</strong> ${i.qra}</p>`;
      }
      if (tipo === 'presenca') {
        const itens = i.presencas.map(p =>
          `<li>${p.qra}: ${p.presente ? '✔️' : '❌'}${
            p.justificativa ? ` (${p.justificativa})` : ''
          }</li>`
        ).join('');
        html += `<ul style="list-style: disc; margin:8px 0 0 16px; padding:0;">${itens}</ul>`;
      } else if (tipo === 'relatorio') {
        html += `<p>${i.texto}</p>`;
      } else {
        html += `<p>${i.recado}</p>`;
      }
      html += `
        <div class="botoes-acoes">
          <button class="btn-baixar" data-id="${i.id}">Baixar</button>
          <button class="btn-excluir" data-id="${i.id}">Excluir</button>
        </div>`;
      entryDiv.innerHTML = html;
      pelBody.appendChild(entryDiv);
    });

    // Toggle ao clicar no cabeçalho do pelotão
    pelHeader.addEventListener('click', () => {
      pelBody.style.display =
        pelBody.style.display === 'block' ? 'none' : 'block';
    });

    // Insere no dia
    dayBody.appendChild(pelHeader);
    dayBody.appendChild(pelBody);
  });


            // toggle dia
            dayHeader.addEventListener('click', () => {
              dayBody.style.display = dayBody.style.display === 'block' ? 'none' : 'block';
            });

            monthBody.appendChild(dayHeader);
            monthBody.appendChild(dayBody);
          });

        // toggle mês
        monthHeader.addEventListener('click', () => {
          monthBody.style.display = monthBody.style.display === 'block' ? 'none' : 'block';
        });

        monthCard.appendChild(monthHeader);
        monthCard.appendChild(monthBody);
        container.appendChild(monthCard);
      });
  }

  // EXECUTA para cada coleção
  const presSnap = await db.collection('presencas').orderBy('date', 'desc').get();
  await renderizarColecao(presSnap, presContainer, 'presenca');

  const relSnap = await db.collection('relatorios').orderBy('date', 'desc').get();
  await renderizarColecao(relSnap, relContainer, 'relatorio');

  const recSnap = await db.collection('recados').orderBy('date', 'desc').get();
  await renderizarColecao(recSnap, recContainer, 'recado');

    // ——— Registrar listeners de Baixar / Excluir ———
  [
    { container: presContainer, tipo: 'presenca' },
    { container: relContainer, tipo: 'relatorio' },
    { container: recContainer, tipo: 'recado' }
  ].forEach(({ container, tipo }) => {
    // Baixar
    container.querySelectorAll('.btn-baixar').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (tipo === 'presenca')       baixarPresencaAdmin(id);
        else if (tipo === 'relatorio') baixarRelatorioAdmin(id);
        else if (tipo === 'recado')    baixarRecadoAdmin(id);
      });
    });
    // Excluir
    container.querySelectorAll('.btn-excluir').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (tipo === 'presenca')       excluirPresencaAdmin(id);
        else if (tipo === 'relatorio') excluirRelatorioAdmin(id);
        else if (tipo === 'recado')    excluirRecadoAdmin(id);
      });
    });
  });

}


// ——— FUNÇÕES AUXILIARES ———

// Exclui uma lista de presença e recarrega
async function excluirPresencaAdmin(id) {
  const res = await Swal.fire({
    title: 'Excluir lista de presença?',
    text: 'Tem certeza que deseja remover esta lista de presença?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar'
  });
  if (!res.isConfirmed) return;
  await db.collection('presencas').doc(id).delete();
  carregarSubmissoesLiderancaAdmin();
  Swal.fire('Excluído!', 'Lista de presença removida com sucesso.', 'success');
}


// Abre modal/formulário para editar (implemente seu próprio UI)
function editarPresencaAdmin(id) {
  // exemplo: abrir um modal e preencher com os dados atuais
  abrirModalEdicaoPresenca(id);
}

// Gera e baixa CSV da lista de presença
async function baixarPresencaAdmin(id) {
  // 1) Busca o documento de presenças
  const doc = await db.collection('presencas').doc(id).get();
  const data = doc.data();
  
  // 2) Prepara os dados para o Excel
  //    Cada linha terá: QRA do Submetente, Data, Pelotão, QRA do Aluno, Presente, Justificativa
  const rows = data.presencas.map(p => ({
    'Data': data.date.split('-').reverse().join('/'),
    'Pelotão': data.pelotao,
    'QRA Aluno': p.qra,
    'Presente': p.presente ? '✔️' : '❌',
    'Justificativa': p.justificativa || ''
  }));

  // 3) Cria a planilha e define colunas com larguras adequadas
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows, { header: ['Data','Pelotão','QRA Aluno','Presente','Justificativa'
  ]});

  // Ajuste de largura das colunas
  ws['!cols'] = [
    { wch: 15 }, // QRA Submetente
    { wch: 12 }, // Data
    { wch: 10 }, // Pelotão
    { wch: 12 }, // QRA Aluno
    { wch: 10 }, // Presente
    { wch: 30 }  // Justificativa
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Lista de Presença');

  // 4) Gera o arquivo e dispara o download
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lista_presenca_${id}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ——— RELATÓRIOS DIÁRIOS ———

// Exclui um relatório e recarrega a lista
async function excluirRelatorioAdmin(id) {
  const res = await Swal.fire({
    title: 'Excluir relatório?',
    text: 'Tem certeza que deseja remover este relatório?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar'
  });
  if (!res.isConfirmed) return;
  await db.collection('relatorios').doc(id).delete();
  carregarSubmissoesLiderancaAdmin();
  Swal.fire('Excluído!', 'Relatório removido com sucesso.', 'success');
}


// Gera e baixa um arquivo de texto com o relatório
async function baixarRelatorioAdmin(id) {
  const doc = await db.collection('relatorios').doc(id).get();
  const data = doc.data();
  const conteudo =
    `Data: ${data.date}\n` +
    `Pelotão: ${data.pelotao}\n` +
    `QRA: ${data.qra}\n\n` +
    `${data.texto || data.relatorio}`;
  const blob = new Blob([conteudo], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio_${id}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ——— RECADOS ———

// Exclui um recado e recarrega a lista
async function excluirRecadoAdmin(id) {
  const res = await Swal.fire({
    title: 'Excluir recado?',
    text: 'Tem certeza que deseja remover este recado?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar'
  });
  if (!res.isConfirmed) return;
  await db.collection('recados').doc(id).delete();
  carregarSubmissoesLiderancaAdmin();
  Swal.fire('Excluído!', 'Recado removido com sucesso.', 'success');
}

// Gera e baixa um arquivo de texto com o recado
async function baixarRecadoAdmin(id) {
  const doc = await db.collection('recados').doc(id).get();
  const data = doc.data();
  const conteudo =
    `Data: ${data.date}\n` +
    `Pelotão: ${data.pelotao}\n` +
    `QRA: ${data.qra}\n\n` +
    `${data.mensagem}`;
  const blob = new Blob([conteudo], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `recado_${id}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── popula lista de presença só com alunos do mesmo pelotão ───
async function carregarListaPresenca() {
  const pel = document.getElementById('pelotaoAluno').value;
  const tbody = document.getElementById('tbodyPresenca');
  tbody.innerHTML = '';
  try {
    const snap = await db.collection('usuarios')
      .where('pelotaoAluno', '==', pel)
      .get();
    snap.forEach(doc => {
      const { qraAluno } = doc.data();
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="padding:10px;">${qraAluno}</td>
        <td style="text-align:center;"><input type="checkbox" class="presenca"></td>
        <td style="text-align:center;">
          <select class="justificativa" style="padding:6px; border-radius:6px; border:1px solid #ccc;">
            <option value="">—</option>
            <option value="atestado">Atestado Médico</option>
            <option value="motivo-familiar">Motivo Familiar</option>
            <option value="transporte">Problemas com Transporte</option>
            <option value="outros">Outros</option>
          </select>
        </td>`;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Erro ao carregar lista de presença:', err);
  }
}
document.addEventListener('DOMContentLoaded', () => {
  const dt = new Date().toISOString().split('T')[0];
  document.getElementById('dataPresenca').value = dt;
});
document.getElementById('selectPelotaoBoletim').addEventListener('change', async () => {
  // Limpa boletim antigo
const container = document.getElementById('boletimAlunoContainer');
const btnExport = document.getElementById('btnExportarBoletimInd');
container.innerHTML = '';
btnExport.style.display = 'none';
document.getElementById('selectAlunoBoletim').addEventListener('change', () => {
  // Sempre que mudar de aluno, limpa o boletim antigo
  const container = document.getElementById('boletimAlunoContainer');
  const btnExport = document.getElementById('btnExportarBoletimInd');
  container.innerHTML = '';
  btnExport.style.display = 'none';
});

  const pel = document.getElementById('selectPelotaoBoletim').value;
  const selectAluno = document.getElementById('selectAlunoBoletim');
  selectAluno.innerHTML = '<option value="">Carregando...</option>';
  selectAluno.disabled = true;

  if (!pel) {
    selectAluno.innerHTML = '<option value="">Selecione um pelotão</option>';
    return;
  }

  const snapshot = await db.collection('usuarios')
    .where('status', '==', 'aprovado')
    .where('pelotaoAluno', '==', pel)
    .get();

  let options = '<option value="">Selecione o aluno</option>';
  snapshot.forEach(doc => {
    const dados = doc.data();
    options += `<option value="${doc.id}">${dados.nomeCompleto} (${dados.qraAluno})</option>`;
  });

  selectAluno.innerHTML = options;
  selectAluno.disabled = false;
});
document.getElementById('btnVerBoletim').addEventListener('click', async () => {
  const email = document.getElementById('selectAlunoBoletim').value;
  const container = document.getElementById('boletimAlunoContainer');
  const btnExport = document.getElementById('btnExportarBoletimInd');
  container.innerHTML = '';
  btnExport.style.display = 'none';

  if (!email) return;

  const doc = await db.collection('usuarios').doc(email).get();
  if (!doc.exists) {
    container.innerHTML = '<p style="color:#777;">Aluno não encontrado.</p>';
    return;
  }

  const dados = doc.data();
// 1) Extrai boletim e pelotão do aluno
const boletim = dados.boletim || {};
const pelAluno = (dados.pelotaoAluno || '').padStart(2, '0');

// 2) Monta lista de disciplinas do pelotão
const disciplinas = Object.keys(boletim).sort((a, b) =>
  a.localeCompare(b, 'pt', { ignorePunctuation: true })
);

if (disciplinas.length === 0) {
  container.innerHTML = '<p style="color:#777;">Nenhuma disciplina encontrada.</p>';
  return;
}

// 3) Renderiza UL de disciplinas
let html = '<ul class="lista-disciplinas">';
disciplinas.forEach(d => {
html += `<li class="disc-item" data-disciplina="${d}">${d}</li>`;
});
html += '</ul>';
container.innerHTML = html;
btnExport.style.display = 'none';

// 4) Para cada LI, adiciona o listener que mostra detalhes
container.querySelectorAll('.disc-item').forEach(item => {
  item.addEventListener('click', () => {
    const disc = item.dataset.disciplina;
    const info = boletim[disc] || {};
   container.innerHTML = `
      <div class="detalhes-boletim">
        <div class="detalhes-header">
          <h3>${disc}</h3>
        </div>
        <div class="detalhes-body">
          <p><strong>Aluno:</strong> ${dados.nomeCompleto}</p>
          <p><strong>QRA:</strong> ${dados.qraAluno}</p>
          <p><strong>Pelotão:</strong> ${dados.pelotaoAluno}</p>
          <hr>
          <p><strong>Nota:</strong> ${info.nota ?? '—'}</p>
          <p><strong>Frequência:</strong> ${info.frequencia ?? '—'}%</p>
          <p><strong>Situação:</strong> ${info.nota >= 6 ? 'Aprovado' : 'Reprovado'}</p>
        </div>
         <div class="det-footer" style="display:flex; gap:8px; align-items:center;">
   <button id="btnVoltarDisciplinas" class="btn-secundario">← Voltar</button>
   <button id="btnBaixarDisciplinas" class="btn-exportar">↓ Baixar</button>
 </div>
      </div>
    `;
    // 5) “Voltar” reaplica o mesmo listener do VerBoletim
    document.getElementById('btnVoltarDisciplinas')
      .addEventListener('click', () => document.getElementById('btnVerBoletim').click());
      // NOVO: Download em PDF
document.getElementById('btnBaixarDisciplinas')
  .addEventListener('click', () => {
    // Usa os objetos já disponíveis no escopo deste listener
    const nomeAluno = dados.nomeCompleto;
    const qra       = dados.qraAluno;
    const cf        = dados.cfAluno;
    const boletimObj = boletim;  // é o mesmo objeto que você usou para renderizar as disciplinas :contentReference[oaicite:2]{index=2}:contentReference[oaicite:3]{index=3}

    // Monta array de linhas para o Excel
    const linhas = Object.entries(boletimObj).map(([disciplina, info]) => ({
      Nome:       nomeAluno,
      QRA:        qra,
      CF:         cf,
      Disciplina: disciplina,
      Nota:       info.nota ?? '',
      Frequencia: info.frequencia ?? '',
      Situação:   info.situacao 
                   || (info.nota >= 7 ? 'Aprovado' : 'Reprovado')
    }));

    // Gera a planilha
    const ws = XLSX.utils.json_to_sheet(linhas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Boletim');

    // Faz o download
    const filename = `Boletim_${nomeAluno.replace(/\s+/g,'_')}_${new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')}.xlsx`;
    XLSX.writeFile(wb, filename);
  });

      
  });
});


});
document.getElementById('btnExportarBoletimInd').addEventListener('click', () => {
  const el = document.getElementById('boletimUnico');
  if (!el) return;

  const opt = {
    margin: 0.5,
    filename: `Boletim_${new Date().toLocaleDateString('pt-BR')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(el).save();
});


// ─── Remove o líder de pelotão ───────────────────────────────────
async function removerLider() {
  const pel = document.getElementById('selectPelotaoLider').value;
  if (!pel) {
    return Swal.fire({ icon: 'warning', title: 'Selecione um pelotão.' });
  }
  try {
    // Busca o líder atual daquele pelotão
    const snap = await db.collection('usuarios')
                         .where('pelotaoAluno','==',pel)
                         .where('role','==','leader')
                         .get();

    if (snap.empty) {
      return Swal.fire({ icon: 'info', title: 'Não há líder definido neste pelotão.' });
    }

    // Atualiza todos para student
    const batch = db.batch();
    snap.forEach(doc => batch.update(doc.ref, { role: 'student' }));
    await batch.commit();

    Swal.fire({ icon: 'success', title: 'Líder removido com sucesso!' });

    // Atualiza os selects na UI
    carregarPelotoesLider();
    document.getElementById('selectQRALider')
            .innerHTML = '<option value="">Selecione</option>';
  } catch (err) {
    console.error('Erro ao remover líder:', err);
    Swal.fire({ icon: 'error', title: 'Falha ao remover líder.' });
  }
}

// ─── Popula select de pelotões para definir líder ───
async function carregarPelotoesLider() {
  const select = document.getElementById('selectPelotaoLider');
  select.innerHTML = '<option value="">Selecione</option>';
  try {
    const snapshot = await db.collection('usuarios').orderBy('pelotaoAluno').get();
    const pelotoes = new Set(snapshot.docs.map(doc => doc.data().pelotaoAluno).filter(p => p));
    Array.from(pelotoes).sort().forEach(pel => {
      const opt = document.createElement('option');
      opt.value = pel;
      opt.textContent = pel.padStart(2, '0');
      select.appendChild(opt);
    });
  } catch (err) {
    console.error('Erro ao carregar pelotões para líder:', err);
  }
}

// ─── Popula select de QRAs após escolher pelotão ───
async function carregarQRAsLiderPorPelotao() {
  const pel = document.getElementById('selectPelotaoLider').value;
  const select = document.getElementById('selectQRALider');
  select.innerHTML = '<option value="">Selecione</option>';
  if (!pel) return;
  try {
    const snap = await db.collection('usuarios')
                         .where('pelotaoAluno', '==', pel)
                         .get();
    snap.forEach(doc => {
      const qra = doc.data().qraAluno;
      const opt = document.createElement('option');
      opt.value = qra;
      opt.textContent = qra;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error('Erro ao carregar QRAs para líder:', err);
  }
}
document.getElementById('selectPelotaoLider')
        .addEventListener('change', carregarQRAsLiderPorPelotao);

// ─── Define o líder de pelotão no Firestore ───
async function definirLider() {
  const pel = document.getElementById('selectPelotaoLider').value;
  const qra = document.getElementById('selectQRALider').value;
  if (!pel || !qra) {
    return Swal.fire({ icon: 'warning', title: 'Selecione pelotão e QRA.' });
  }
  try {
    // Remove o role 'leader' anterior deste pelotão
    const prev = await db.collection('usuarios')
                         .where('pelotaoAluno','==',pel)
                         .where('role','==','leader')
                         .get();
    prev.forEach(doc => doc.ref.update({ role: 'student' }));
    // Atribui role 'leader' ao novo selecionado
    const sel = await db.collection('usuarios')
                        .where('pelotaoAluno','==',pel)
                        .where('qraAluno','==',qra)
                        .get();
    sel.forEach(doc => doc.ref.update({ role: 'leader' }));
    Swal.fire({ icon: 'success', title: 'Líder definido com sucesso!' });
  } catch (err) {
    console.error('Erro ao definir líder:', err);
    Swal.fire({ icon: 'error', title: 'Falha ao definir líder.' });
  }
}
// ─── Medidas Disciplinares ───

// 1) Carrega pelotões para o select de Medidas :contentReference[oaicite:2]{index=2}:contentReference[oaicite:3]{index=3}
async function carregarPelotoesMedida() {
  const select = document.getElementById('selectPelotaoMedida');
  select.innerHTML = '<option value="">Carregando...</option>';
  try {
    const snapshot = await db.collection('usuarios').get();
    const pelSet = new Set();
    snapshot.forEach(doc => {
      const p = doc.data().pelotaoAluno;
      if (p) pelSet.add(p.padStart(2,'0'));
    });
    const pelList = Array.from(pelSet).sort();
    select.innerHTML = '<option value="">Selecione</option>' +
      pelList.map(p => `<option value="${p}">${p}º Pelotão</option>`).join('');
  } catch (err) {
    console.error('Erro ao carregar pelotões:', err);
    select.innerHTML = '<option value="">Erro ao carregar</option>';
  }
}

// 2) Carrega alunos ao mudar de pelotão :contentReference[oaicite:4]{index=4}:contentReference[oaicite:5]{index=5}
async function carregarAlunosMedidaPorPelotao() {
  const pel = document.getElementById('selectPelotaoMedida').value;
  const select = document.getElementById('selectAlunoMedida');
  if (!pel) {
    select.innerHTML = '<option value="">Selecione um pelotão primeiro</option>';
    return;
  }
  select.innerHTML = '<option value="">Carregando...</option>';
  try {
    const snapshot = await db.collection('usuarios')
                             .where('pelotaoAluno','==',pel)
                             .get();
    let opts = '<option value="">Selecione</option>';
    snapshot.forEach(doc => {
      const d = doc.data();
      opts += `<option value="${d.qraAluno}">${d.qraAluno} – ${d.nomeCompleto}</option>`;
    });
    select.innerHTML = opts;
  } catch (err) {
    console.error('Erro ao carregar alunos:', err);
    select.innerHTML = '<option value="">Erro ao carregar</option>';
  }
}

// 3) Popula o select de Medidas (códigos + descrição conforme imagem)
function carregarMedidasDisciplinares() {
  const medidas = [
    { code: 'A1', label: 'desrespeitar as normas de boas maneiras' },
    { code: 'A2', label: 'uso de palavras de baixo calão' },
    { code: 'A3', label: 'falta de camaradagem ou cortesia' },
    { code: 'B1', label: 'chegar atrasado' },
    { code: 'B2', label: 'não entregar o trabalho escolar no prazo marcado' },
    { code: 'C1', label: 'falta de interesse pelo ensino' },
    { code: 'C2', label: 'trabalho escolar mal elaborado' },
    { code: 'C3', label: 'não apresentar o material escolar que a aula exigir' },
    { code: 'D1', label: 'uniforme sujo, amarrotado ou rasgado' },
    { code: 'D2', label: 'uniforme desabotoado' },
    { code: 'D3', label: 'uniforme incompleto, combinação irregular de peças ou outras irregularidades' },
    { code: 'E1', label: 'modo incorreto de apresentar-se aos superiores' },
    { code: 'E2', label: 'mau aspecto na apresentação pessoal' },
    { code: 'E3', label: 'falta de atitude' },
    { code: 'F1', label: 'objetos ou peças do uso diário abandonados' },
    { code: 'F2', label: 'armário desarrumado' },
    { code: 'F3', label: 'não preservar a limpeza das instalações' },
    { code: 'G1', label: 'trabalhar mal como Chefe de Turma' },
    { code: 'G2', label: 'não obedecer às ordens do Chefe de Turma' },
    { code: 'G3', label: 'dificultar o comando do Chefe de Turma' },
    { code: 'G4', label: 'falta de presteza no cumprimento das ordens recebidas' },
    { code: 'G5', label: 'não levar o conhecimento do superior à execução da ordem recebida' },
    { code: 'G6', label: 'deixar de prestar ao superior as manifestações de respeito previstas' },
    { code: 'G7', label: 'fumar em locais ou situações proibidas' },
    { code: 'G8', label: 'simular doenças para não cumprir as obrigações' },
    { code: 'G9', label: 'incorreções nas posições em forma' },
    { code: 'G10', label: 'inobservância das prescrições regulamentares' },
    { code: 'H1', label: 'equipamento ou material s/j uso ou mal conservado' },
    { code: 'H2', label: 'abandono de equipamento ou material' },
    { code: 'I1', label: 'cabelos fora dos padrões regulamentares' },
    { code: 'I2', label: 'barba por fazer' },
    { code: 'I3', label: 'falta de higiene pessoal' }
  ];
  const select = document.getElementById('selectMedida');
  select.innerHTML = '<option value="">Selecione</option>';
  medidas.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.code;
    opt.textContent = `${m.code} – ${m.label}`;
    select.appendChild(opt);
  });
}

// 4) Ao clicar em “Aplicar Medida”, salva no Firestore
document.getElementById('btnAplicarMedida').addEventListener('click', async () => {
  const pel = document.getElementById('selectPelotaoMedida').value;
  const qra = document.getElementById('selectAlunoMedida').value;
  const med = document.getElementById('selectMedida').value;
  const desc = document.getElementById('descricaoMedida').value.trim();
  if (!pel || !qra || !med) {
    return Swal.fire({ icon: 'warning', title: 'Selecione pelotão, aluno e medida.' });
  }
  try {
    await db.collection('medidasDisciplinares').add({
      pelotao: pel,
      qraAluno: qra,
      codigo: med,
      descricao: desc,
      timestamp: new Date()
    });
    Swal.fire({ icon: 'success', title: 'Medida disciplinar aplicada!' });
    // limpa form
    document.getElementById('selectPelotaoMedida').value = '';
    document.getElementById('selectAlunoMedida').innerHTML = '<option value="">Selecione um pelotão primeiro</option>';
    document.getElementById('selectMedida').value = '';
    document.getElementById('descricaoMedida').value = '';
  } catch (err) {
    console.error('Erro ao aplicar medida:', err);
    Swal.fire({ icon: 'error', title: 'Falha ao aplicar medida.' });
  }
});

// 5) Chama tudo na inicialização
document.addEventListener('DOMContentLoaded', () => {
  carregarPelotoesMedida();
  carregarMedidasDisciplinares();
  document
    .getElementById('selectPelotaoMedida')
    .addEventListener('change', carregarAlunosMedidaPorPelotao);
});
// ─── Carrega e renderiza o histórico de medidas ───
// mapeamento código → nome oficial da medida
const nomesMedidasDisciplinares = {
  A1: 'desrespeitar as normas de boas maneiras',
  A2: 'uso de palavras de baixo calão',
  A3: 'falta de camaradagem ou cortesia',
  B1: 'chegar atrasado',
  B2: 'não entregar o trabalho escolar no prazo',
  C1: 'falta de interesse pelo ensino',
  C2: 'trabalho escolar mal elaborado',
  C3: 'não apresentar o material exigido em aula',
  D1: 'uniforme sujo, amarrotado ou rasgado',
  D2: 'uniforme desabotoado',
  D3: 'uniforme incompleto ou irregular',
  E1: 'modo incorreto de apresentar-se aos superiores',
  E2: 'mau aspecto na apresentação pessoal',
  E3: 'falta de atitude',
  F1: 'objetos do uso diário abandonados',
  F2: 'armário desarrumado',
  F3: 'não preservar a limpeza das instalações',
  G1: 'trabalhar mal como Chefe de Turma',
  G2: 'não obedecer ordens do Chefe de Turma',
  G3: 'dificultar o comando do Chefe de Turma',
  G4: 'falta de presteza ao cumprir ordens',
  G5: 'não levar conhecimento do superior à execução',
  G6: 'deixar de prestar manifestações de respeito',
  G7: 'fumar em locais proibidos',
  G8: 'simular doenças para evitar obrigações',
  G9: 'incorreções nas posições em forma',
  G10: 'inobservância de prescrições regulamentares',
  H1: 'material mal conservado',
  H2: 'abandono de material',
  I1: 'cabelos fora dos padrões regulamentares',
  I2: 'barba por fazer',
  I3: 'falta de higiene pessoal'
};

async function carregarListaMedidas() {
  const container = document.getElementById('listaMedidas');
  container.innerHTML = 'Carregando histórico…';
  try {
    const snapshot = await db.collection('medidasDisciplinares').get();
    const medidas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    medidas.sort((a, b) =>
      a.pelotao.localeCompare(b.pelotao) ||
      b.timestamp.toDate() - a.timestamp.toDate()
    );
    const grupos = {};
    medidas.forEach(m => (grupos[m.pelotao] = grupos[m.pelotao] || []).push(m));
    if (!Object.keys(grupos).length) {
      container.innerHTML = '<p>Nenhuma medida aplicada ainda.</p>';
      return;
    }
    container.innerHTML = '';
    Object.keys(grupos).sort().forEach(pel => {
      const detalhes = document.createElement('details');
      detalhes.innerHTML = `
        <summary>Pelotão ${pel}º</summary>
        <ul>
          ${grupos[pel].map(m => {
            const hora = m.timestamp.toDate().toLocaleString('pt-BR');
            const nomeMedida = nomesMedidasDisciplinares[m.codigo] || m.codigo;
            const detalheLivre = m.descricao ? `: ${m.descricao}` : '';
            return `
            <li>
              <div style="margin-bottom:6px;">
                <strong>${m.qraAluno}</strong> – ${m.codigo} – ${nomeMedida}${detalheLivre}
                <em>em ${hora}</em>
              </div>
              <button
                class="btn-exportar btnBaixarParte"
                data-id="${m.id}"
                data-pelotao="${m.pelotao}"
                data-qra="${m.qraAluno}"
                data-codigo="${m.codigo}"
                data-descricao="${m.descricao || ''}"
                data-timestamp="${m.timestamp.toDate().toISOString()}"
                style="padding:4px 8px; font-size:0.9rem;"
              >
                ↓ Baixar
              </button>
            </li>`;
          }).join('')}
        </ul>`;
      container.appendChild(detalhes);
    });
    // Adiciona listeners aos botões recém-criados
    container.querySelectorAll('.btnBaixarParte').forEach(btn => {
    
      btn.addEventListener('click', () => {
  const d = btn.dataset;
  baixarParteMedida(
    d.id,    // ✅ passa também o id do documento
    d.qra,
    d.codigo,
    d.descricao,
    d.timestamp,
    d.pelotao
  );
});

    });
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p>Falha ao carregar histórico.</p>';
  }
}


// 3. Dispara o carregamento no início…
document.addEventListener('DOMContentLoaded', () => {
  carregarListaMedidas();
});

// …e também após aplicar cada nova medida
document
  .getElementById('btnAplicarMedida')
  .addEventListener('click', async () => {
    // (seu código de salvar já existente…)
    // depois de salvar com sucesso:
    carregarListaMedidas();
  });
async function baixarParteMedida(id, qra, codigo, descricao, tsISO, pelotao) {
  try {
    // 1) Recupera dados do aluno
    const snap = await db.collection('usuarios')
      .where('qraAluno','==',qra).limit(1).get();
    if (snap.empty) throw new Error('Aluno não encontrado');
    const aluno = snap.docs[0].data();
    const nome = aluno.nomeCompleto;
    const cf   = aluno.cfAluno || '—';
    // 2) Formata data
    const dataObj = new Date(tsISO);
    const dataTxt = dataObj.toLocaleDateString('pt-BR');
    const allSnap = await db
      .collection('medidasDisciplinares')
      .orderBy('timestamp')
      .get();
    const allIds = allSnap.docs.map(doc => doc.id);
    const idx    = allIds.indexOf(id);                     // posição 0-based
    const seq    = String(idx + 1).padStart(2, '0');       // ex: "01", "02"
    const year   = dataObj.getFullYear().toString().slice(-2); // ex: "25"
    const docCode = `${seq}/${year}`;                      // ex: "01/25"
    // 4) Renderiza o HTML fora da tela, mas visível para o canvas
    const tpl = `
      <div style="font-family:Arial, sans-serif; padding:20px; line-height:1.4;">
        <!-- cabeçalho e identificação -->
        </p><p>&nbsp;
        <p style="text-align:center; font-weight:bold; font-size:1.1rem;">
          CIDADE DE<br>GUARULHOS
        </p>
        <p style="text-align:center; font-weight:bold; font-size:1.1rem;">
          SECRETARIA PARA ASSUNTOS DE SEGURANÇA PÚBLICA<br>
          GUARDA CIVIL MUNICIPAL<br>
          DIVISÃO TÉCNICA DO CENTRO DE FORMAÇÃO DA GCM
        </p>
        <p>&nbsp;</p>
        <p>Guarulhos, ${dataTxt}</p>
        <p><strong>Parte Disciplinar nº ${docCode};</strong> Origem: EFAG.</p>
        <p>
          Comunico a Vossa Senhoria que, na data de ${dataTxt}, o(a) servidor(a)
          <strong>${nome}</strong>, QRA <strong>${qra}</strong>, C.F <strong>${cf}</strong>,
          transgrediu em  FALTA ESCOLAR/DISCIPLINAR, mediante ao código:
          <br><br>
          <em>${codigo} – ${nomesMedidasDisciplinares[codigo] || codigo}${descricao ? ': ' + descricao : ''}</em>
        </p>
        Comunico ainda, que o (a) mesmo (a)  tem conhecimento do manual de aluno e mesmo assim transgrediu as normas.
        <p>&nbsp;</p>
        <div style="text-align: center;">
        <!-- Linhas de assinatura -->
    <p>Assinatura do(a) Aluno(a):_____________________________</p>
    <p>&nbsp;</p>
    <p>GCM ________________________ , C.F:_____ </p>
<p>Assinatura:____________________</p> <p>
    <p>&nbsp;</p>
  <p>
  <!-- === Assinatura === -->
<div class="assinatura" style="text-align: center; margin-top: 40px;">
  <p style="margin:2px 0; line-height:1.2;">____________________________</p>
  <p style="margin:2px 0; line-height:1.2;">Ricardo Beserra <strong>Gentil</strong></p>
  <p style="margin:2px 0; line-height:1.2;"><strong>Inspetor Chefe</strong></p>
  <p style="margin:2px 0; line-height:1.2;">Chefe de Divisão Técnica</p>
</div>
<p>&nbsp;</p><p>&nbsp;</p>
   <!-- === Rodapé com endereço === -->
     Rua Emílio Lang Júnior, 136 – Ponte Grande<br>
     efaggcm@guarulhos.sp.gov.br
      </div>
    `;

// ① Cria um container temporário e injeta o HTML
const tmp = document.createElement('div');
tmp.innerHTML = tpl;
document.body.appendChild(tmp);

// ② Monta um documento Word simples baseado em HTML
const header = `
  <html xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:w="urn:schemas-microsoft-com:office:word"
        xmlns="http://www.w3.org/TR/REC-html40">
  <head><meta charset="utf-8"><title>ParteDisciplinar</title></head><body>`;
const footer = `</body></html>`;
const htmlWord = header + tmp.innerHTML + footer;

// ③ Cria o blob e dispara o download
const blob = new Blob(['\ufeff', htmlWord], { type: 'application/msword' });
const url  = URL.createObjectURL(blob);
const a    = document.createElement('a');
a.href     = url;
a.download = `Parte_Disciplinar_${qra}_${dataTxt.replace(/\//g,'-')}.doc`;
document.body.appendChild(a);
a.click();

// ④ Limpa o DOM
URL.revokeObjectURL(url);
document.body.removeChild(a);
document.body.removeChild(tmp);



  } catch (err) {
    console.error(err);
    Swal.fire({ icon:'error', title:'Erro ao gerar documento.' });
  }
}