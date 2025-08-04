const express = require('express');
const cors = require('cors');
const fs = require('fs');
const FormData = require('form-data');
const axios = require("axios");
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 7860;

let awal = path.join(__dirname, 'chat.json');
fs.writeFileSync('/tmp/chat.json', fs.readFileSync(awal));
let file = '/tmp/chat.json'

let currentIp = "1.1.1.1";

axios.get("https://r-nozawa-cloud.hf.space/uploads/chat.json", { responseType: 'stream' })
  .then(response => {
    const writer = fs.createWriteStream(file);
    response.data.pipe(writer);

    writer.on('finish', () => {
      console.log('File berhasil disimpan');
    });

    writer.on('error', (error) => {
      console.error('Error menyimpan file:', error);
    });
  })
  .catch(error => {
    console.error('Error mengunduh file:', error);
  });
  
app.use(cors());

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 10, // maksimal 10 permintaan
  message: { error: 'Terlalu banyak permintaan.' }
});

app.get('/editip/:ip', (req, res) => {
  const newIp = req.params.ip;
  if (!validateIp(newIp)) {
    res.status(400).json({ error: 'IP tidak valid' });
    return;
  }
  currentIp = newIp;
  res.json({ message: 'IP berhasil diubah' });
});

function validateIp(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  for (let part of parts) {
    if (isNaN(part) || part < 0 || part > 255) return false;
  }
  return true;
}

// Kirim pesan
app.get('/send', limiter, async (req, res) => {
  try {
    const msg = req.query;
    if (!msg.nama || !msg.text) {
      return res.status(400).json({ error: 'Nama dan teks pesan wajib diisi' });
    }
    
    let messages = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : [];
    
    let v = false
    if (msg.nama.includes("<sok asik>")) {
      v = true
      msg.nama = msg.nama.split("<sok asik>")[0]
    }
    
    messages.push({ 
      id: Date.now(),
      verif: v,
      nama: msg.nama, 
      text: msg.text, 
      timestamp: new Date().toISOString() 
    });

    fs.writeFileSync(file, JSON.stringify(messages, null, 2));
    res.json({ success: true });
    try {
      await uploadChat(fs.readFileSync(file))
    } catch (e) {
      console.log("error upload")
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ambil pesan
app.get('/messages', (req, res) => {
  const messages = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : [];
  res.json(messages);
});

// Hapus pesan berdasarkan ID
app.get('/delete/:id', async (req, res) => {
  const requesterIP = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const id = Number(req.params.id); // konversi ke number
  
  if (!requesterIP.includes(currentIp)) {
    return res.status(403).json({ error: 'Unauthorized IP' });
  }

  if (!fs.existsSync(file)) return res.json({ success: false, message: 'No chat file found' });

  let messages = JSON.parse(fs.readFileSync(file));
  const initialLength = messages.length;
  messages = messages.filter(msg => msg.id !== id);

  if (messages.length === initialLength) {
    return res.status(404).json({ success: false, message: 'Message not found' });
  }

  fs.writeFileSync(file, JSON.stringify(messages, null, 2));
  res.json({ success: true, message: 'Message deleted' });
});

app.get('/download', (req, res) => {
  const messages = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : [];
  const tempFilePath = path.join(__dirname, 'temp-messages.json');
  
  // Simpan sementara ke file
  fs.writeFileSync(tempFilePath, JSON.stringify(messages, null, 2));

  // Kirim sebagai file
  res.download(tempFilePath, 'messages.json', (err) => {
    if (err) {
      console.error('Download error:', err);
      res.status(500).send('Could not download file.');
    }

    // Hapus file sementara setelah dikirim
    fs.unlinkSync(tempFilePath);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

async function uploadChat(file) {
    const formData = new FormData();
    
    formData.append('file', file, {
      filename: "chat.json",
      contentType: "application/json"
    });
    
    try {
        const response = await axios.post(
            "https://r-nozawa-cloud.hf.space/upload",
            formData,
            { headers: formData.getHeaders() }
        );
        return response.data
    } catch (error) {
        console.error("Upload gagal:", error.response?.data || error.message);
    }
}