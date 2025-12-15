import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';


const firebaseConfig = {
  apiKey: "AIzaSyCFHIkFS0naOyT3Gz86YwU1o4y2C_56s9w",
  authDomain: "ionic-173ca.firebaseapp.com",
  projectId: "ionic-173ca",
  storageBucket: "ionic-173ca.firebasestorage.app",
  messagingSenderId: "712191145928",
  appId: "1:712191145928:web:901e3e39f799a8d57572fd",
  measurementId: "G-WJ5690LGLY"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Função de Login
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  const recuperarSenhaForm = document. getElementById('recuperarSenhaForm');
  const criarContaForm = document.getElementById('criarContaForm');

  // Login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const senha = document.getElementById('senha').value;
      const mensagem = document.getElementById('mensagemLogin');

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, senha);
        mensagem.innerHTML = '<ion-text color="success">Login realizado com sucesso!</ion-text>';
        document.getElementById('usuarioLogado').textContent = `Usuário: ${userCredential.user.email}`;
        setTimeout(() => mostrarTela('tela2'), 500);
      } catch (error) {
        let errorMessage = 'Erro ao fazer login';
        if (error.code === 'auth/invalid-credential') {
          errorMessage = 'Email ou senha incorretos';
        } else if (error.code === 'auth/user-not-found') {
          errorMessage = 'Usuário não encontrado';
        } else if (error.code === 'auth/wrong-password') {
          errorMessage = 'Senha incorreta';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Email inválido';
        }
        mensagem. innerHTML = `<ion-text color="danger">${errorMessage}</ion-text>`;
      }
    });
  }

  // Recuperar Senha
  if (recuperarSenhaForm) {
    recuperarSenhaForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('emailRecuperar').value;
      const mensagem = document.getElementById('mensagemRecuperar');

      try {
        await sendPasswordResetEmail(auth, email);
        mensagem.innerHTML = '<ion-text color="success">Email de recuperação enviado!  Verifique sua caixa de entrada.</ion-text>';
        setTimeout(() => mostrarTela('tela1'), 2000);
      } catch (error) {
        let errorMessage = 'Erro ao enviar email de recuperação';
        if (error.code === 'auth/user-not-found') {
          errorMessage = 'Email não encontrado';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Email inválido';
        }
        mensagem.innerHTML = `<ion-text color="danger">${errorMessage}</ion-text>`;
      }
    });
  }

  // Criar Conta
  if (criarContaForm) {
    criarContaForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('emailCriar').value;
      const senha = document.getElementById('senhaCriar').value;
      const mensagem = document.getElementById('mensagemCriar');

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        mensagem.innerHTML = '<ion-text color="success">Conta criada com sucesso! </ion-text>';
        setTimeout(() => mostrarTela('tela1'), 1500);
      } catch (error) {
        let errorMessage = 'Erro ao criar conta';
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'Este email já está em uso';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Email inválido';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'A senha deve ter pelo menos 6 caracteres';
        }
        mensagem.innerHTML = `<ion-text color="danger">${errorMessage}</ion-text>`;
      }
    });
  }
});

// Função de Logout
window.logout = async function() {
  try {
    await signOut(auth);
    mostrarTela('tela1');
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
  }
};

// Monitora o estado de autenticação
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('Usuário logado:', user.email);
  } else {
    console.log('Nenhum usuário logado');
  }
});
