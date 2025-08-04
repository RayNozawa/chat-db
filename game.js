let jawabanBenar = null;
let userName = localStorage.getItem('userName');

document.addEventListener('DOMContentLoaded', () => {
  const sendBtn = document.getElementById('sendBtn');
  const input = document.getElementById('message');
  
  sendBtn.addEventListener('click', async () => {
    const pesan = input.value.trim();
    alert(pesan)
    if (!pesan) return;
    
    if (pesan.toLowerCase() === 'susunkata') {
      try {
        const { data: game } = await axios.get('/susunkata')
        jawabanBenar = game.jawaban.toLowerCase();
        alert("Memainkan Game Susunkata")
      } catch (e) {
        alert(e.message)
      }
    } else if (jawabanBenar) {
      if (pesan.toLowerCase() === jawabanBenar) {
        await fetch(`/susunkata?text=${encodeURIComponent(userName)}%20Selamat!%0A🎉Kamu Benar,%20Jawabannya:%20${encodeURIComponent(jawabanBenar)}`);
        jawabanBenar = null;
      } else {
        tampilkanPesan("Nozawa BOT", "❌ Salah! Coba lagi.");
      }
    }
  });
});

function tampilkanPesan(pengirim, teks) {
  const chatBox = document.getElementById('chat-box');
  const el = document.createElement('div');
  el.className = 'chat-message';
  el.innerHTML = `<strong>${pengirim}:</strong> ${teks}`;
  chatBox.appendChild(el);
  chatBox.scrollTop = chatBox.scrollHeight;
}