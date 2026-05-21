import { API_BASE_URL } from '../utils/constants';

// Offline fallback database for typical crop diseases
const OFFLINE_DISEASE_DB = {
  'apple leaf scab': {
    description: 'Apple scab is caused by the fungus Venturia inaequalis. It produces olive-green to black velvety spots on leaves, causing leaves to yellow and drop prematurely, weakening the tree.',
    treatment: '- Apply organic sulfur or copper-based fungicides in early spring during green tip stage.\n- Rake and burn or compost fallen leaves in autumn to eliminate overwintering spores.\n- Prune inner branches to increase sunlight and wind penetration, keeping leaves dry.',
    prevention: '- Choose disease-resistant apple varieties (like Liberty, Enterprise, or Freedom).\n- Avoid overhead sprinkler irrigation; water directly at the root zone.\n- Maintain a clean orchard floor by clearing weed cover and pruning debris.'
  },
  'early blight': {
    description: 'Early blight is a fungal infection caused by Alternaria solani. It targets older tomato leaves first, creating dark brown spots with concentric ring patterns that resemble target boards.',
    treatment: '- Remove all infected lower leaves immediately to prevent fungal spores from splashing upwards.\n- Apply neem oil spray or an organic copper fungicide every 7 to 10 days during humid weather.\n- Apply a thick layer of clean straw mulch around the plant base to create a physical barrier against soil-borne spores.',
    prevention: '- Rotate crops, ensuring tomatoes or potatoes are not planted in the same soil for at least 3 years.\n- Ensure a 3-foot spacing between plants to maximize air circulation.\n- Water early in the morning and avoid wetting the foliage.'
  },
  'late blight': {
    description: 'Late blight is a highly destructive disease caused by the oomycete Phytophthora infestans. It causes dark, water-soaked leaf spots with white fungal growth on the undersides during cool, wet periods.',
    treatment: '- Act immediately: Remove and bag infected plants. Securely bury or burn them; do not compost.\n- Apply preventive copper fungicides to surrounding healthy crops to save the remaining yield.\n- Immediately alert neighboring farmers and local agricultural officers as late blight spreads rapidly via wind.',
    prevention: '- Always plant certified disease-free potato seed tubers or healthy tomato seedlings.\n- Keep leaves dry using drip lines or early-morning ground watering.\n- Monitor weather closely; late blight thrives in cool, highly humid climates.'
  },
  'default': {
    description: 'This is a common agricultural pathogen. It usually thrives in high humidity, crowded foliage, and poor soil conditions, spreading via water splash, wind, or contaminated garden tools.',
    treatment: '- Prune off all infected foliage using shears sanitized with 70% isopropyl alcohol.\n- Apply organic neem oil or home-made baking soda spray (1 tbsp baking soda + 1 tsp liquid soap in 1 gal water).\n- Reduce watering frequency and avoid applying heavy nitrogen fertilizers during active infection.',
    prevention: '- Sanitize all pruning tools between plants to prevent mechanical transmission.\n- Water at the soil level rather than splashing the crop canopy.\n- Boost soil health and plant immunity by applying organic compost tea.'
  }
};

/**
 * Sends a chat message history to the secure FastAPI backend chatbot proxy
 * Supports offline demo fallback if the server is unreachable or offline.
 */
export const sendChatMessage = async (messages, customSystemPrompt) => {
  try {
    const payload = {
      messages,
      systemPrompt: customSystemPrompt || null
    };

    console.log('Sending chat history to secure backend proxy:', `${API_BASE_URL}/chat`);
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }

    return data.reply || 'Could not fetch a valid AI response.';
  } catch (error) {
    console.warn('Chatbot Service: API call failed. Using offline fallback response.', error);
    
    // Simulate a highly intelligent offline expert response based on user last message
    const lastUserMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
    
    await new Promise((resolve) => setTimeout(resolve, 800)); // Realistic delay

    if (lastUserMessage.includes('serious') || lastUserMessage.includes('harmful') || lastUserMessage.includes('severity')) {
      return 'According to agricultural records, this disease can be **highly serious** if left unchecked, reducing crop yield by **30% to 60%**. I highly recommend applying the organic treatment remedies immediately and keeping the leaves dry to stop active spread.';
    }
    if (lastUserMessage.includes('treatment') || lastUserMessage.includes('cure') || lastUserMessage.includes('remedy')) {
      return 'The best treatments include:\n\n1. **Organic Neem Oil Spray**: Mix 2 tbsp neem oil with 1 tsp mild soap in 1 gallon of water and spray thoroughly.\n2. **Cultural Control**: Prune infected leaves immediately and sanitize tools.\n3. **Soil Mulching**: Spread straw mulch around the base to prevent soil splashing.';
    }
    if (lastUserMessage.includes('prevent') || lastUserMessage.includes('spread')) {
      return 'To prevent spread, you must:\n\n- **Sanitize tools**: Clean shears with alcohol between plants.\n- **Drip Irrigation**: Switch to ground watering to keep leaf canopies dry.\n- **Crop Rotation**: Do not plant the same crop families in this soil next season.';
    }
    if (lastUserMessage.includes('organic') || lastUserMessage.includes('natural')) {
      return 'For a fully **organic solution**, spray a mixture of **baking soda (1 tbsp)**, hort oil, and warm water. This alters leaf pH and stops fungal spores from germinating. Applying **compost tea** to the roots also boosts general plant immunity!';
    }
    if (lastUserMessage.includes('pesticide') || lastUserMessage.includes('chemical')) {
      return 'Always prioritize **organic biocides** first. If a chemical intervention is required, use a mild **copper octanoate** or chlorothalonil fungicide. *Important: Never spray during high temperatures, and consult local extension officers for dosage rules.*';
    }
    if (lastUserMessage.includes('fertilizer')) {
      return 'During active infection, **avoid high-nitrogen fertilizers**, as new lush growth is highly susceptible to disease. Instead, apply a balanced organic compost or a **potassium-rich foliar spray** to strengthen plant cell walls.';
    }
    if (lastUserMessage.includes('irrigation') || lastUserMessage.includes('water')) {
      return 'Switch immediately to **drip irrigation** or water directly at the root zone early in the morning. Fungal spores require active moisture on leaves for **4-6 hours** to germinate. Keeping foliage dry is the best protection!';
    }

    return `Hello! I am operating in **Agricultural Offline Demo Mode** since the local server or Groq API is temporarily unavailable.\n\nAsk me simple questions about **treatment**, **prevention**, **organic solutions**, **pesticides**, **fertilizers**, or **severity levels**, and I will supply expert agricultural guidance based on our local crop databases!`;
  }
};

/**
 * Asynchronously generates the initial summary cards using secure FastAPI proxy
 * Supports graceful offline fallbacks.
 */
export const generateDiseaseSummaries = async (crop, disease, confidence) => {
  try {
    const payload = {
      crop,
      disease,
      confidence
    };

    console.log('Requesting disease summaries from secure backend proxy:', `${API_BASE_URL}/chat/summaries`);
    const response = await fetch(`${API_BASE_URL}/chat/summaries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }

    return {
      diseaseSummary: data.diseaseSummary || 'Could not load summary.',
      treatmentSummary: data.treatmentSummary || 'Could not load treatment advice.',
      preventionSummary: data.preventionSummary || 'Could not load prevention advice.',
    };
  } catch (error) {
    console.warn('Failed to pre-generate summaries. Returning local database fallback.', error);
    
    const normalizedDisease = disease.toLowerCase().trim();
    // Find in offline database, fallback to default
    const dbMatch = OFFLINE_DISEASE_DB[normalizedDisease] || 
                    Object.values(OFFLINE_DISEASE_DB).find(d => normalizedDisease.includes(d)) || 
                    OFFLINE_DISEASE_DB.default;

    return {
      diseaseSummary: `**${disease}** was detected on your **${crop}**. ${dbMatch.description}`,
      treatmentSummary: dbMatch.treatment,
      preventionSummary: dbMatch.prevention,
    };
  }
};

