const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const { format } = require('date-fns'); // para formatar as datas
const app = express();
const PORT = 3000;

// Configurações do Firebase
const serviceAccount = require('./firebaseConfig.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Rota para verificar umidade e temperatura em um horário específico
app.post('/verificar', async (req, res) => {
    let { dataHora } = req.body;

    console.log("Data e Hora recebida:", dataHora);

    const startTime = new Date(dataHora);
    const endTime = new Date(dataHora);
    endTime.setMinutes(endTime.getMinutes() + 1);

    console.log("Data e Hora para consulta (início):", startTime.toISOString());
    console.log("Data e Hora para consulta (fim):", endTime.toISOString());

    try {
        const snapshot = await db.collection('umidadeTemperatura')
            .where('dataHora', '>=', admin.firestore.Timestamp.fromDate(startTime))
            .where('dataHora', '<', admin.firestore.Timestamp.fromDate(endTime))
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ message: 'Dados não encontrados para a data e hora selecionadas.' });
        }

        let data = [];
        snapshot.forEach(doc => {
            const docData = doc.data();
            data.push({
                dataHora: format(docData.dataHora.toDate(), 'dd/MM/yyyy HH:mm:ss'),
                temperatura: docData.temperatura,
                umidade: docData.umidade
            });
        });

        res.json(data);
    } catch (error) {
        console.error("Erro ao buscar dados:", error);
        res.status(500).json({ error: error.message });
    }
});

// Nova rota para exibir todos os dados
app.get('/exibirTodos', async (req, res) => {
    try {
        const snapshot = await db.collection('umidadeTemperatura').get();

        if (snapshot.empty) {
            return res.status(404).json({ message: 'Nenhum dado encontrado.' });
        }

        let todosDados = [];
        snapshot.forEach(doc => {
            const docData = doc.data();
            todosDados.push({
                dataHora: format(docData.dataHora.toDate(), 'dd/MM/yyyy HH:mm:ss'), // Formata a data e hora
                temperatura: docData.temperatura,
                umidade: docData.umidade
            });
        });

        res.json(todosDados);
    } catch (error) {
        console.error("Erro ao buscar todos os dados:", error);
        res.status(500).json({ error: error.message });
    }
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
