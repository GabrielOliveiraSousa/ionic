function mostrarTela(telaId) {
  // Esconde todas as telas
  const telas = document.querySelectorAll('.tela');
  telas.forEach(tela => tela.classList.remove('ativa'));
  
  // Mostra a tela selecionada
  const telaSelecionada = document.getElementById(telaId);
  if (telaSelecionada) {
    telaSelecionada. classList.add('ativa');
  }
}