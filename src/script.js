// Função para trocar entre telas
function mostrarTela (idTela) {
// Oculta todas as telas
document.querySelectorAll(".tela").forEach(tela => {
tela.classList.remove("ativa");
});
// Mostra apenas a tela selecionada
document.getElementById(idTela).classList.add("ativa");
}
 
