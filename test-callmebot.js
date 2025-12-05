// Test CallMeBot API
const axios = require('axios');
require('dotenv').config();

const CALLMEBOT_PHONE = process.env.CALLMEBOT_PHONE;
const CALLMEBOT_APIKEY = process.env.CALLMEBOT_APIKEY;

console.log('🧪 Testing CallMeBot API...');
console.log('Phone:', CALLMEBOT_PHONE);
console.log('API Key:', CALLMEBOT_APIKEY);

async function testCallMeBot() {
  try {
    const testMessage = 'Test message from GuardianshipApp - If you see this, the API is working!';
    const url = `https://api.callmebot.com/whatsapp.php?phone=${CALLMEBOT_PHONE}&text=${encodeURIComponent(testMessage)}&apikey=${CALLMEBOT_APIKEY}`;
    
    console.log('\n📤 Sending test message...');
    
    const response = await axios.get(url);
    console.log('✅ Success! Response:', response.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.response?.data || error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure you sent "I allow callmebot to send me messages" to +1 (760) 294-0620');
    console.log('2. Check your API key is correct');
    console.log('3. Phone format should be: country code + number (no + or spaces)');
  }
}

testCallMeBot();