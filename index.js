const axios = require('axios');
const fs = require('fs').promises;
const FormData = require('form-data');
const SECRET_KEY = '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';

const main = async () =>  {
    console.log('run app...');
    console.log("\n==============\n   Transcription:");
    const transcriptionText = await getTranscription('example01.mp3');
    console.log(transcriptionText);


    console.log("\n==============\n   Summary:");
    const summaryText = await getSummary(transcriptionText);
    console.log(summaryText);


    console.log("\n==============\n   Notes1:");
    const notesText = await getNotes(summaryText);
    console.log(notesText);


    console.log("\n==============\n   Actions:");
    const actionsText = await getActions(notesText);
    console.log(actionsText);
}

const getTranscription = async (fileName, retryCount = 0) => {
    try {
        const audioFile = await fs.readFile(fileName);
        const form = new FormData();
        form.append('file', audioFile, fileName);
        form.append('model', 'whisper-1');
        const response = await axios.post(
            'https://api.openai.com/v1/audio/transcriptions',
            form,
            {
                headers: {
                    Authorization: `Bearer ${SECRET_KEY}`,
                    ...form.getHeaders(),
                },
            }
        );
        return response.data.text;
    } catch (error) {
        if (error.response && error.response.status === 429 && retryCount < 5) {
            // Retry the request with an exponential backoff strategy.
            const retryAfter = Math.pow(2, retryCount) * 1000; // Retry after 2, 4, 8, 16, 32 seconds
            console.warn(`Rate limit exceeded. Retrying in ${retryAfter / 1000} seconds...`);
            await new Promise((resolve) => setTimeout(resolve, retryAfter));
            return getTranscription(fileName, retryCount + 1);
        } else {
            console.error('Error occurred while processing transcription:', error.message);
            throw error;
        }
    }
};

const getSummary = async (text) => {
    const commandText =
        "Convert my short hand into a first-hand account of the meeting::\n\n";

    const body = {
        prompt: `${commandText} ${text}`,
        model: 'text-davinci-003',
        temperature: 0,
        max_tokens: 256,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
    };

    const response = await axios.post(
        'https://api.openai.com/v1/completions',
        body,
        {
            headers: {
                Authorization: `Bearer ${SECRET_KEY}`,
            },
        });
    return response.data.choices[0].text;
}

const getNotes = async (text) => {
    const commandText = "Create a note in the format of a healthcare SOAP note and format it with headings for each section:\n\n";
    const body = {
        prompt: `${commandText} ${text}`,
        model: 'text-davinci-003',
        temperature: 0,
        max_tokens: 256,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
    };
    const response = await axios.post(
        'https://api.openai.com/v1/completions',
        body,
        {
            headers: {
                Authorization: `Bearer ${SECRET_KEY}`,
            },
        }
    );
    return response.data.choices[0].text;
}

const getActions = async (text) => {
    const commandText = "Create actions after the meeting:\n\n";

    const body = {
        prompt: `${commandText} ${text}`,
        model: 'text-davinci-003',
        temperature: 0,
        max_tokens: 256,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
    };
    const response = await axios.post(
        'https://api.openai.com/v1/completions',
        body,
        {
            headers: {
                Authorization: `Bearer ${SECRET_KEY}`,
            },
        }
    );
    return response.data.choices[0].text;
}

main();
