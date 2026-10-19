const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const extractDataWithAI = async (filePath, documentType) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

   
    if (!apiKey || apiKey === 'your_gemini_key_here') {
      console.log('⚠️ GEMINI_API_KEY not found. Using Mock AI Data.');
      return getMockData(documentType);
    }

    const genAI = new GoogleGenerativeAI(apiKey);

  
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite', 
      generationConfig: {
        temperature: 0.1,      
        responseMimeType: 'application/json' 
      }
    });

    const ext = path.extname(filePath).toLowerCase();
    let result;

    const prompt = `You are a precise data extraction AI.
Analyze this ${documentType} and extract the fields below.
Return ONLY a valid JSON object. No markdown, no explanation.
If a field is not found, set it to null.

{
  "companyName": null,
  "registrationNumber": null,
  "gstNumber": null,
  "address": null,
  "bankAccountNumber": null,
  "ifscCode": null
}`;

    // ========== TEXT FILE ==========
    if (ext === '.txt') {
      const textContent = fs.readFileSync(filePath, 'utf-8');
      result = await model.generateContent([
        prompt + `\n\nDocument Content:\n${textContent}`
      ]);
    }
    // ========== IMAGE or PDF ==========
    else {
      const fileBuffer = fs.readFileSync(filePath);
      const base64Data = fileBuffer.toString('base64');

      let mimeType = 'image/jpeg';
      if (ext === '.png') mimeType = 'image/png';
      if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
      if (ext === '.pdf') mimeType = 'application/pdf';
      if (ext === '.webp') mimeType = 'image/webp';

      result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType
          }
        }
      ]);
    }

    const responseText = result.response.text();
    return parseAIResponse(responseText);

  } catch (error) {
    console.error('AI Service Error:', error.message);
    // Fail hone pe bhi app crash na ho
    return getMockData(documentType);
  }
};


const parseAIResponse = (text) => {
  try {
    // Remove ```json ... ``` if present
    let cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    // Agar pure text ke beech JSON ho
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleaned = jsonMatch[0];

    const parsed = JSON.parse(cleaned);

    // Ensure all keys exist
    return {
      companyName: parsed.companyName || null,
      registrationNumber: parsed.registrationNumber || null,
      gstNumber: parsed.gstNumber || null,
      address: parsed.address || null,
      bankAccountNumber: parsed.bankAccountNumber || null,
      ifscCode: parsed.ifscCode || null
    };
  } catch (err) {
    console.error('Failed to parse AI JSON:', text);
    return getMockData('Unknown');
  }
};

const getMockData = (type) => {
  if (type === 'GST Certificate') {
    return {
      companyName: 'ABC Technologies Pvt Ltd',
      gstNumber: '29ABCDE1234F1Z5',
      address: 'Bangalore, Karnataka',
      registrationNumber: null,
      bankAccountNumber: null,
      ifscCode: null
    };
  }
  if (type === 'Bank Document') {
    return {
      companyName: null,
      registrationNumber: null,
      gstNumber: null,
      address: null,
      bankAccountNumber: '123456789012',
      ifscCode: 'HDFC0001233'
    };
  }
  // Registration Certificate
  return {
    companyName: 'ABC Technologies Pvt Ltd',
    registrationNumber: 'U72200KA2020PTC123456',
    gstNumber: null,
    address: 'Bangalore, Karnataka',
    bankAccountNumber: null,
    ifscCode: null
  };
};

module.exports = { extractDataWithAI };