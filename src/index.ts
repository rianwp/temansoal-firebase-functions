import { HttpsError, onCall } from "firebase-functions/v2/https"
import { Configuration, OpenAIApi } from "openai"

const configuration = new Configuration({
  organization: "org-sDSe26piBSIXFhgP6BuwbtB2",
  apiKey: process.env.OPENAI_API_KEY,
})

const openai = new OpenAIApi(configuration)

type generateQuestionForm = {
  mapel: string,
  tingkatKesulitan: string,
  haveOptions: boolean,
  topik: string,
  jumlahSoal: number
}

export const buatsoal = onCall({secrets: ["OPENAI_API_KEY"], timeoutSeconds: 300}, async (req) => {
  const { mapel, tingkatKesulitan, haveOptions, topik, jumlahSoal } = req.data as generateQuestionForm
  const jumlahSoalPrompt = `berikan soal ujian berjumlah ${jumlahSoal} soal,`
  const mapelPrompt = `untuk pelajaran ${mapel},`
  const tingkatKesulitanPrompt = `untuk tingkat ${tingkatKesulitan},`
  const topikPrompt = `dengan topik terkait: ${topik}`
  const jawabanPrompt = `gunakan format json ${haveOptions ? `[{soal:"soal", pilihan:[{huruf: (A,B,C,D,E), deskripsi:"deskripsi"}], jawaban:{huruf: (A,B,C,D,E), deskripsi:"deskripsi"}, pembahasan: "pembahasan"}]` : `[{soal:"soal", jawaban:"jawaban", pembahasan: "pembahasan"}]`}.`
  const aturanPrompt = `${haveOptions ? "pilihan dan jawaban harus menyertakan huruf(A,B,C,D,E) dalam huruf kapital" : ""}. Jangan tambahkan awalan angka pada setiap soal. Jika terdapat soal cerita yang berhubungan, tuliskan cerita pada setiap soal. Jika soal cerita minimal 1 paragraf.`
  const bahasaPrompt = `Gunakan referensi kurikulum di Indonesia.`
  const jsonPrompt = `Jangan tambahkan penjelasan apapun, hanya dengan bentuk json. Ikuti format ini tanpa penyimpangan. Berikan pembahasan hanya 2 baris saja. Do not return any non-json text or numbering`
  const prompt = `${jumlahSoalPrompt} ${mapelPrompt} ${tingkatKesulitanPrompt} ${topikPrompt} ${jawabanPrompt} ${aturanPrompt} ${bahasaPrompt} ${jsonPrompt}`

  const temperature = mapel.toLowerCase() === "matematika" ? 0.5 : 0.4
  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo-16k",
      messages: [{
        role: "user", content: prompt
      }],
      stream: false,
      temperature,
      max_tokens: 3500,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      n: 1
    })
    return {
      data: JSON.parse(completion.data.choices[0].message?.content as string)
    }
    
  } catch(error) {
    throw new HttpsError("internal", String(error))
  }
})

// export const buatsoal = onRequest({ secrets: ["OPENAI_API_KEY"] }, async (request, response) => {
//   response.set("Access-Control-Allow-Origin", "*")
//   if(request.method !== "POST"){
//     response.status(400).send("Gunakan POST request")
//   } else {
//     const { mapel, tingkatKesulitan, haveOptions, topik, jumlahSoal = 1 } = request.body as generateQuestionForm
//     const jumlahSoalPrompt = `berikan ${jumlahSoal} soal ujian`
//     const mapelPrompt = `untuk pelajaran ${mapel},`
//     const tingkatKesulitanPrompt = `untuk ${tingkatKesulitan},`
//     const topikPrompt = `dengan topik terkait: ${topik}`
//     const jawabanPrompt = `gunakan format json ${haveOptions ? `[{soal:"soal", pilihan:[{huruf: (A,B,C,D,E), deskripsi:"deskripsi"}], jawaban:{huruf: (A,B,C,D,E), deskripsi:"deskripsi"}, pembahasan: "pembahasan"}]` : `[{soal:"soal", jawaban:"jawaban", pembahasan: "pembahasan"}]`}.`
//     const aturanPrompt = `${haveOptions ? "pilihan dan jawaban harus menyertakan huruf(A,B,C,D,E) dalam huruf kapital" : ""}. Jangan tambahkan awalan angka pada setiap soal. Jika terdapat soal cerita yang berhubungan, tuliskan cerita pada setiap soal. Jika soal cerita minimal 1 paragraf.`
//     const bahasaPrompt = `Gunakan referensi kurikulum di Indonesia.`
//     const jsonPrompt = `Jangan tambahkan penjelasan apapun, hanya dengan bentuk json. Ikuti format ini tanpa penyimpangan.`
//     const prompt = `${jumlahSoalPrompt} ${mapelPrompt} ${tingkatKesulitanPrompt} ${topikPrompt} ${jawabanPrompt} ${aturanPrompt} ${bahasaPrompt} ${jsonPrompt}`

//     const temperature = mapel.toLowerCase() === "matematika" ? 0.5 : 0.4
//     try {
//       const completion = await openai.createChatCompletion({
//         model: "gpt-3.5-turbo",
//         messages: [{
//           role: "user", content: prompt
//         }],
//         stream: false,
//         temperature,
//         max_tokens: 3500,
//         top_p: 1,
//         frequency_penalty: 0,
//         presence_penalty: 0,
//         n: 1
//       })
//       response.status(200).send(completion.data.choices[0].message?.content)
//     } catch(error) {
//       response.status(500).send("Terjadi Kesalahan")
//     }
//   }
// })
