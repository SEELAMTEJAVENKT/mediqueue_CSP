import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Mic, Volume2, VolumeX, User, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { NeumorphCard } from '../ui/NeumorphCard';
import type { Language } from '../../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

type LangMap = { en: string; hi: string; te: string };
type LangSuggestions = { en: string[]; hi: string[]; te: string[] };

interface ResponseRule {
  keywords: string[];
  responses: LangMap;
  suggestions: LangSuggestions;
}

const RULES: ResponseRule[] = [
  // Greetings
  {
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
      'namaste', 'namaskar', 'namaskaram', 'vanakkam',
      'नमस्ते', 'हेलो', 'हाय', 'सुप्रभात', 'नमस्कार',
      'నమస్కారం', 'హలో', 'హాయ్', 'శుభోదయం'],
    responses: {
      en: "Hello! I'm MediQueue Assistant, your personal health guide. I can help you:\n• Book appointments with doctors\n• Find hospitals and specialists\n• Check your symptoms\n• Upload and review medical reports\n\nWhat can I help you with today?",
      hi: "नमस्ते! मैं MediQueue सहायक हूं, आपका व्यक्तिगत स्वास्थ्य मार्गदर्शक। मैं आपकी मदद कर सकता हूं:\n• डॉक्टरों के साथ अपॉइंटमेंट बुक करें\n• अस्पताल और विशेषज्ञ खोजें\n• अपने लक्षणों की जांच करें\n• मेडिकल रिपोर्ट अपलोड और समीक्षा करें\n\nआज मैं आपकी किस तरह मदद कर सकता हूं?",
      te: "నమస్కారం! నేను MediQueue సహాయకుడిని, మీ వ్యక్తిగత ఆరోగ్య మార్గదర్శకుడిని. నేను మీకు సహాయపడగలను:\n• డాక్టర్లతో అపాయింట్‌మెంట్లు బుక్ చేయండి\n• ఆసుపత్రులు మరియు నిపుణులను కనుగొనండి\n• మీ లక్షణాలను తనిఖీ చేయండి\n• వైద్య నివేదికలు అప్‌లోడ్ చేయండి\n\nఈరోజు నేను మీకు ఎలా సహాయపడగలను?",
    },
    suggestions: {
      en: ['Book an appointment', 'Find a doctor', 'Check symptoms', 'Find hospitals'],
      hi: ['अपॉइंटमेंट बुक करें', 'डॉक्टर खोजें', 'लक्षण जांचें', 'अस्पताल खोजें'],
      te: ['అపాయింట్‌మెంట్ బుక్ చేయండి', 'డాక్టర్ కనుగొనండి', 'లక్షణాలు తనిఖీ', 'ఆసుపత్రి కనుగొనండి'],
    },
  },

  // Emergency
  {
    keywords: ['emergency', 'urgent', 'critical', 'ambulance', '108', 'heart attack', 'stroke',
      'unconscious', 'not breathing', 'accident',
      'आपातकाल', 'एम्बुलेंस', 'दिल का दौरा', 'दुर्घटना', 'बेहोश',
      'అత్యవసరం', 'యాంబులెన్స్', 'గుండె పోటు', 'ప్రమాదం', 'స్పృహ కోల్పోవడం'],
    responses: {
      en: "🚨 EMERGENCY ALERT\n\nIf this is a medical emergency, please:\n1. Call **108** (Emergency Services) immediately\n2. Call **102** (Ambulance)\n3. Go to the nearest Emergency Room\n\nDo NOT wait for an online appointment during a medical emergency. Time is critical!\n\nFor non-emergency urgent care, I can help you find the nearest hospital.",
      hi: "🚨 आपातकालीन सूचना\n\nयदि यह चिकित्सा आपातकाल है, कृपया:\n1. तुरंत **108** (आपातकालीन सेवाएं) पर कॉल करें\n2. **102** (एम्बुलेंस) पर कॉल करें\n3. निकटतम आपातकालीन कक्ष में जाएं\n\nचिकित्सा आपातकाल में ऑनलाइन अपॉइंटमेंट का इंतजार न करें। समय बहुत महत्वपूर्ण है!\n\nगैर-आपातकालीन देखभाल के लिए मैं निकटतम अस्पताल खोजने में मदद कर सकता हूं।",
      te: "🚨 అత్యవసర హెచ్చరిక\n\nఇది వైద్య అత్యవసర స్థితి అయితే, దయచేసి:\n1. వెంటనే **108** (అత్యవసర సేవలు)కి కాల్ చేయండి\n2. **102** (యాంబులెన్స్)కి కాల్ చేయండి\n3. సమీప అత్యవసర గదికి వెళ్లండి\n\nవైద్య అత్యవసర స్థితిలో ఆన్‌లైన్ అపాయింట్‌మెంట్ కోసం వేచి ఉండకండి. సమయం చాలా విలువైనది!\n\nఅత్యవసరం కాని సంరక్షణ కోసం సమీప ఆసుపత్రి కనుగొనడంలో నేను సహాయపడగలను.",
    },
    suggestions: {
      en: ['Find nearest hospital', 'Book urgent appointment'],
      hi: ['निकटतम अस्पताल खोजें', 'तत्काल अपॉइंटमेंट बुक करें'],
      te: ['సమీప ఆసుపత్రి కనుగొనండి', 'అత్యవసర అపాయింట్‌మెంట్ బుక్ చేయండి'],
    },
  },

  // Booking appointment
  {
    keywords: ['book', 'appointment', 'schedule', 'consult', 'consultation', 'visit', 'meet doctor', 'see doctor',
      'अपॉइंटमेंट', 'बुक', 'बुकिंग', 'मुलाकात', 'डॉक्टर से मिलना', 'परामर्श',
      'అపాయింట్‌మెంట్', 'బుక్', 'బుకింగ్', 'సంప్రదింపు', 'డాక్టర్‌ని కలవడం'],
    responses: {
      en: "I can guide you to book an appointment! Here's how:\n\n1. Go to **Book Appointment** from your dashboard\n2. Select a hospital\n3. Choose a department\n4. Pick your preferred doctor\n5. Select a date and time slot\n6. Confirm your booking\n\nYou'll receive a confirmation notification once booked.",
      hi: "मैं आपको अपॉइंटमेंट बुक करने में मार्गदर्शन कर सकता हूं! यहां बताया गया है:\n\n1. अपने डैशबोर्ड से **अपॉइंटमेंट बुक करें** पर जाएं\n2. एक अस्पताल चुनें\n3. विभाग चुनें\n4. अपना पसंदीदा डॉक्टर चुनें\n5. तारीख और समय स्लॉट चुनें\n6. अपनी बुकिंग की पुष्टि करें\n\nबुकिंग के बाद आपको पुष्टि अधिसूचना मिलेगी।",
      te: "అపాయింట్‌మెంట్ బుక్ చేసుకోవడానికి నేను మీకు మార్గనిర్దేశం చేస్తాను! ఇలా చేయండి:\n\n1. మీ డాష్‌బోర్డ్ నుండి **అపాయింట్‌మెంట్ బుక్ చేయండి** కి వెళ్లండి\n2. ఆసుపత్రి ఎంచుకోండి\n3. విభాగం ఎంచుకోండి\n4. మీకు నచ్చిన డాక్టర్‌ని ఎంచుకోండి\n5. తేదీ మరియు సమయ స్లాట్ ఎంచుకోండి\n6. మీ బుకింగ్‌ను నిర్ధారించండి\n\nబుక్ చేసిన తర్వాత మీకు నిర్ధారణ నోటిఫికేషన్ వస్తుంది.",
    },
    suggestions: {
      en: ['Book appointment now', 'Find a doctor first', 'View my appointments'],
      hi: ['अभी अपॉइंटमेंट बुक करें', 'पहले डॉक्टर खोजें', 'मेरी अपॉइंटमेंट देखें'],
      te: ['ఇప్పుడే అపాయింట్‌మెంట్ బుక్ చేయండి', 'ముందు డాక్టర్ కనుగొనండి', 'నా అపాయింట్‌మెంట్లు చూడండి'],
    },
  },

  // Find hospital
  {
    keywords: ['hospital', 'clinic', 'healthcare center', 'medical center', 'find hospital', 'near me', 'nearby',
      'अस्पताल', 'क्लिनिक', 'नजदीकी', 'पास में',
      'ఆసుపత్రి', 'క్లినిక్', 'సమీపంలో', 'దగ్గర'],
    responses: {
      en: "I can help you find the right hospital! On our **Hospitals** page you can:\n\n• Browse all empanelled hospitals\n• View departments and specializations\n• Check available doctors\n• See contact information and address\n\nWould you like to browse hospitals now?",
      hi: "मैं आपको सही अस्पताल खोजने में मदद कर सकता हूं! हमारे **अस्पताल** पेज पर आप:\n\n• सभी सूचीबद्ध अस्पताल देख सकते हैं\n• विभाग और विशेषज्ञताएं देख सकते हैं\n• उपलब्ध डॉक्टरों की जांच करें\n• संपर्क जानकारी और पता देखें\n\nक्या आप अभी अस्पतालों को ब्राउज़ करना चाहते हैं?",
      te: "సరైన ఆసుపత్రి కనుగొనడంలో నేను మీకు సహాయపడగలను! మా **ఆసుపత్రులు** పేజీలో మీరు:\n\n• అన్ని జాబితా చేయబడిన ఆసుపత్రులను బ్రౌజ్ చేయవచ్చు\n• విభాగాలు మరియు ప్రత్యేకతలు చూడవచ్చు\n• అందుబాటులో ఉన్న డాక్టర్లను తనిఖీ చేయవచ్చు\n• సంప్రదింపు సమాచారం మరియు చిరునామా చూడవచ్చు\n\nఇప్పుడు ఆసుపత్రులను బ్రౌజ్ చేయాలనుకుంటున్నారా?",
    },
    suggestions: {
      en: ['Browse hospitals', 'Find a specialist', 'Book appointment'],
      hi: ['अस्पताल ब्राउज़ करें', 'विशेषज्ञ खोजें', 'अपॉइंटमेंट बुक करें'],
      te: ['ఆసుపత్రులు బ్రౌజ్ చేయండి', 'నిపుణుడిని కనుగొనండి', 'అపాయింట్‌మెంట్ బుక్ చేయండి'],
    },
  },

  // Find doctor
  {
    keywords: ['doctor', 'specialist', 'physician', 'surgeon', 'cardiologist', 'dermatologist',
      'neurologist', 'gynecologist', 'pediatrician', 'orthopedic', 'psychiatrist',
      'dentist', 'ophthalmologist', 'urologist', 'endocrinologist',
      'डॉक्टर', 'विशेषज्ञ', 'चिकित्सक', 'सर्जन', 'हृदय रोग विशेषज्ञ',
      'డాక్టర్', 'నిపుణుడు', 'వైద్యుడు', 'సర్జన్'],
    responses: {
      en: "Finding the right doctor is easy! On the **Doctors** page you can:\n\n• Search by name or specialization\n• View doctor profiles, experience, and ratings\n• Check consultation fees\n• See their available schedule\n\nWhat type of specialist are you looking for?",
      hi: "सही डॉक्टर खोजना आसान है! **डॉक्टर** पेज पर आप:\n\n• नाम या विशेषज्ञता से खोज सकते हैं\n• डॉक्टर प्रोफाइल, अनुभव और रेटिंग देख सकते हैं\n• परामर्श शुल्क जांच सकते हैं\n• उनका उपलब्ध शेड्यूल देख सकते हैं\n\nआप किस प्रकार के विशेषज्ञ की तलाश कर रहे हैं?",
      te: "సరైన డాక్టర్‌ని కనుగొనడం సులభం! **డాక్టర్లు** పేజీలో మీరు:\n\n• పేరు లేదా ప్రత్యేకత ద్వారా శోధించవచ్చు\n• డాక్టర్ ప్రొఫైల్‌లు, అనుభవం మరియు రేటింగ్‌లు చూడవచ్చు\n• సంప్రదింపు రుసుములు తనిఖీ చేయవచ్చు\n• వారి అందుబాటు షెడ్యూల్ చూడవచ్చు\n\nమీరు ఏ రకమైన నిపుణుడిని వెతుకుతున్నారు?",
    },
    suggestions: {
      en: ['Browse all doctors', 'Book with a doctor', 'Check specializations'],
      hi: ['सभी डॉक्टर देखें', 'डॉक्टर से बुक करें', 'विशेषज्ञताएं देखें'],
      te: ['అన్ని డాక్టర్లు చూడండి', 'డాక్టర్‌తో బుక్ చేయండి', 'ప్రత్యేకతలు చూడండి'],
    },
  },

  // Symptoms - Chest/Heart
  {
    keywords: ['chest pain', 'chest tightness', 'heart pain', 'palpitation', 'irregular heartbeat', 'shortness of breath',
      'सीने में दर्द', 'दिल की धड़कन', 'सांस लेने में तकलीफ',
      'గుండె నొప్పి', 'ఛాతీ నొప్పి', 'శ్వాస తీసుకోవడంలో ఇబ్బంది'],
    responses: {
      en: "⚠️ Chest symptoms can be serious. Please take this seriously:\n\n**Seek IMMEDIATE care if you have:**\n• Severe or crushing chest pain\n• Pain spreading to arm, jaw, or back\n• Difficulty breathing\n• Cold sweats + nausea\n\n**Could be:** Angina, Heart Attack, Costochondritis, Acid Reflux, Anxiety\n\n**Recommended Specialist:** Cardiologist\n\nShall I help you book an appointment with a cardiologist?",
      hi: "⚠️ सीने के लक्षण गंभीर हो सकते हैं। कृपया इसे गंभीरता से लें:\n\n**तत्काल देखभाल लें यदि:**\n• गंभीर या तीव्र सीने में दर्द\n• दर्द हाथ, जबड़े या पीठ तक फैले\n• सांस लेने में कठिनाई\n• ठंडा पसीना + मतली\n\n**हो सकता है:** एनजाइना, दिल का दौरा, कोस्टोकॉन्ड्राइटिस, एसिड रिफ्लक्स\n\n**अनुशंसित विशेषज्ञ:** हृदय रोग विशेषज्ञ (Cardiologist)\n\nक्या मैं आपको कार्डियोलॉजिस्ट के साथ अपॉइंटमेंट बुक करने में मदद करूं?",
      te: "⚠️ ఛాతీ లక్షణాలు తీవ్రంగా ఉండవచ్చు. దయచేసి దీన్ని తీవ్రంగా తీసుకోండి:\n\n**వెంటనే వైద్యసహాయం తీసుకోండి:**\n• తీవ్రమైన లేదా నొక్కుడు ఛాతీ నొప్పి\n• చేయి, దవడ లేదా వీపుకు వ్యాపించే నొప్పి\n• శ్వాస తీసుకోవడంలో ఇబ్బంది\n• చల్లని చెమట + వాంతి భావన\n\n**కావచ్చు:** ఆంజైనా, గుండె పోటు, కోస్టోకాండ్రిటిస్, యాసిడ్ రిఫ్లక్స్\n\n**సూచించిన నిపుణుడు:** హృద్రోగ నిపుణుడు (Cardiologist)\n\nహృద్రోగ నిపుణుడితో అపాయింట్‌మెంట్ బుక్ చేయడానికి నేను సహాయపడనా?",
    },
    suggestions: {
      en: ['Book cardiologist', 'Call emergency (108)', 'Check symptoms'],
      hi: ['कार्डियोलॉजिस्ट बुक करें', 'आपातकाल कॉल करें (108)', 'लक्षण जांचें'],
      te: ['కార్డియాలజిస్ట్ బుక్ చేయండి', 'అత్యవసరం కాల్ (108)', 'లక్షణాలు తనిఖీ'],
    },
  },

  // Symptoms - Headache
  {
    keywords: ['headache', 'migraine', 'head pain', 'head ache', 'head hurts', 'temple pain',
      'सिरदर्द', 'माइग्रेन', 'सिर दर्द',
      'తలనొప్పి', 'మైగ్రేన్', 'తల నొప్పి'],
    responses: {
      en: "Headaches can have many causes. Here's a quick guide:\n\n**Tension Headache** — Stress, dehydration, poor posture\n**Migraine** — Throbbing pain, light sensitivity, nausea\n**Cluster Headache** — Severe pain around one eye\n**Sinusitis** — Pressure around forehead/cheeks\n\n**When to see a doctor urgently:**\n• Sudden severe 'thunderclap' headache\n• Headache with fever + stiff neck\n• Headache after head injury\n\n**Recommended Specialist:** Neurologist",
      hi: "सिरदर्द के कई कारण हो सकते हैं। यहां एक त्वरित मार्गदर्शिका है:\n\n**तनाव सिरदर्द** — तनाव, निर्जलीकरण, खराब मुद्रा\n**माइग्रेन** — धड़कन दर्द, प्रकाश संवेदनशीलता, मतली\n**क्लस्टर सिरदर्द** — एक आंख के आसपास तीव्र दर्द\n**साइनसाइटिस** — माथे/गालों के आसपास दबाव\n\n**तुरंत डॉक्टर के पास जाएं यदि:**\n• अचानक तीव्र सिरदर्द\n• बुखार + गर्दन में अकड़न के साथ सिरदर्द\n• सिर की चोट के बाद सिरदर्द\n\n**अनुशंसित विशेषज्ञ:** न्यूरोलॉजिस्ट",
      te: "తలనొప్పికి చాలా కారణాలు ఉండవచ్చు. ఇక్కడ ఒక త్వరిత మార్గదర్శిని:\n\n**టెన్షన్ తలనొప్పి** — ఒత్తిడి, నిర్జలీకరణం, చెడు భంగిమ\n**మైగ్రేన్** — స్పందించే నొప్పి, కాంతి సున్నితత్వం, వాంతి భావన\n**క్లస్టర్ తలనొప్పి** — ఒక కంటి చుట్టూ తీవ్రమైన నొప్పి\n**సైనసైటిస్** — నుదురు/చెంపల చుట్టూ ఒత్తిడి\n\n**వెంటనే డాక్టర్‌ను సంప్రదించండి:**\n• హఠాత్తుగా తీవ్రమైన తలనొప్పి\n• జ్వరం + మెడ బిగువుతో తలనొప్పి\n• తల గాయం తర్వాత తలనొప్పి\n\n**సూచించిన నిపుణుడు:** న్యూరాలజిస్ట్",
    },
    suggestions: {
      en: ['Book neurologist', 'Check symptoms', 'General physician'],
      hi: ['न्यूरोलॉजिस्ट बुक करें', 'लक्षण जांचें', 'सामान्य चिकित्सक'],
      te: ['న్యూరాలజిస్ట్ బుక్ చేయండి', 'లక్షణాలు తనిఖీ', 'సాధారణ వైద్యుడు'],
    },
  },

  // Symptoms - Fever/Cold
  {
    keywords: ['fever', 'temperature', 'cold', 'flu', 'cough', 'runny nose', 'sneezing', 'sore throat', 'body ache',
      'बुखार', 'सर्दी', 'जुकाम', 'खांसी', 'गला दर्द', 'शरीर में दर्द',
      'జ్వరం', 'జలుబు', 'దగ్గు', 'గొంతు నొప్పి', 'శరీర నొప్పి'],
    responses: {
      en: "For fever and cold symptoms:\n\n**Home care tips:**\n• Rest well and stay hydrated\n• Take paracetamol for fever > 38°C\n• Warm water gargles for sore throat\n• Steam inhalation for congestion\n\n**See a doctor if:**\n• Fever > 103°F (39.4°C)\n• Fever lasting more than 3 days\n• Breathing difficulty\n• Severe weakness\n\n**Recommended Specialist:** General Physician",
      hi: "बुखार और सर्दी के लक्षणों के लिए:\n\n**घरेलू देखभाल सुझाव:**\n• अच्छी तरह आराम करें और हाइड्रेटेड रहें\n• 38°C से अधिक बुखार के लिए पेरासिटामोल लें\n• गले में दर्द के लिए गुनगुने पानी से गरारे करें\n• जमाव के लिए भाप लें\n\n**डॉक्टर के पास जाएं यदि:**\n• बुखार 103°F (39.4°C) से अधिक\n• 3 दिनों से अधिक बुखार\n• सांस लेने में कठिनाई\n• गंभीर कमजोरी\n\n**अनुशंसित विशेषज्ञ:** सामान्य चिकित्सक",
      te: "జ్వరం మరియు జలుబు లక్షణాలకు:\n\n**ఇంట్లో సంరక్షణ చిట్కాలు:**\n• బాగా విశ్రాంతి తీసుకోండి మరియు నీరు తాగండి\n• 38°C కంటే ఎక్కువ జ్వరానికి పారాసెటమాల్ తీసుకోండి\n• గొంతు నొప్పికి గోరువెచ్చని నీటితో గారెలు\n• నిల్వకు ఆవిరి పీల్చుకోండి\n\n**డాక్టర్‌ను సంప్రదించండి:**\n• జ్వరం 103°F (39.4°C) కంటే ఎక్కువ\n• 3 రోజులకంటే ఎక్కువ జ్వరం\n• శ్వాస తీసుకోవడంలో ఇబ్బంది\n• తీవ్రమైన బలహీనత\n\n**సూచించిన నిపుణుడు:** సాధారణ వైద్యుడు",
    },
    suggestions: {
      en: ['Book general physician', 'Check symptoms', 'Find hospital'],
      hi: ['सामान्य चिकित्सक बुक करें', 'लक्षण जांचें', 'अस्पताल खोजें'],
      te: ['సాధారణ వైద్యుడిని బుక్ చేయండి', 'లక్షణాలు తనిఖీ', 'ఆసుపత్రి కనుగొనండి'],
    },
  },

  // Symptoms - Stomach/Digestion
  {
    keywords: ['stomach', 'abdomen', 'abdominal pain', 'nausea', 'vomiting', 'diarrhea',
      'constipation', 'acidity', 'gastric', 'indigestion', 'heartburn', 'bloating',
      'पेट दर्द', 'उल्टी', 'दस्त', 'कब्ज', 'एसिडिटी', 'अपच',
      'కడుపు నొప్పి', 'వాంతి', 'అతిసారం', 'మలబద్ధకం', 'ఆమ్లత', 'అజీర్ణం'],
    responses: {
      en: "Digestive issues are very common. Here's what to watch for:\n\n**Mild cases (home care):**\n• Small, frequent meals\n• Avoid spicy/oily food\n• ORS for diarrhea\n• Antacids for acidity\n\n**See a doctor if:**\n• Severe or persistent pain\n• Blood in stool or vomit\n• Unexplained weight loss\n• Symptoms > 2 weeks\n\n**Recommended Specialist:** Gastroenterologist / General Physician",
      hi: "पाचन समस्याएं बहुत सामान्य हैं। यहां क्या देखना है:\n\n**हल्के मामले (घरेलू देखभाल):**\n• छोटे, बार-बार भोजन\n• मसालेदार/तैलीय भोजन से बचें\n• दस्त के लिए ORS\n• एसिडिटी के लिए एंटासिड\n\n**डॉक्टर के पास जाएं यदि:**\n• गंभीर या लगातार दर्द\n• मल या उल्टी में खून\n• अस्पष्टीकृत वजन कम होना\n• 2 सप्ताह से अधिक लक्षण\n\n**अनुशंसित विशेषज्ञ:** गैस्ट्रोएंटेरोलॉजिस्ट / सामान्य चिकित्सक",
      te: "జీర్ణ సమస్యలు చాలా సాధారణం. ఏమి చూడాలో ఇక్కడ ఉంది:\n\n**తేలికపాటి సందర్భాలు (ఇంటి సంరక్షణ):**\n• చిన్న, తరచూ భోజనాలు\n• కారంగా/నూనెగా ఉన్న ఆహారం నివారించండి\n• అతిసారానికి ORS\n• ఆమ్లతకు యాంటాసిడ్లు\n\n**డాక్టర్‌ను సంప్రదించండి:**\n• తీవ్రమైన లేదా నిరంతర నొప్పి\n• మలంలో లేదా వాంతిలో రక్తం\n• వివరించలేని బరువు తగ్గడం\n• 2 వారాలకు మించిన లక్షణాలు\n\n**సూచించిన నిపుణుడు:** గ్యాస్ట్రోఎంటరాలజిస్ట్ / సాధారణ వైద్యుడు",
    },
    suggestions: {
      en: ['Book gastroenterologist', 'Book general physician'],
      hi: ['गैस्ट्रोएंटेरोलॉजिस्ट बुक करें', 'सामान्य चिकित्सक बुक करें'],
      te: ['గ్యాస్ట్రోఎంటరాలజిస్ట్ బుక్ చేయండి', 'సాధారణ వైద్యుడిని బుక్ చేయండి'],
    },
  },

  // Symptoms - Back/Joint pain
  {
    keywords: ['back pain', 'back ache', 'joint pain', 'knee pain', 'shoulder pain', 'neck pain', 'arthritis', 'spine',
      'पीठ दर्द', 'जोड़ों का दर्द', 'घुटने का दर्द', 'कंधे का दर्द', 'गर्दन दर्द', 'गठिया',
      'వీపు నొప్పి', 'కీళ్ళ నొప్పి', 'మోకాలు నొప్పి', 'భుజం నొప్పి', 'మెడ నొప్పి', 'ఆర్థ్రైటిస్'],
    responses: {
      en: "Musculoskeletal pain is very common. Here's guidance:\n\n**For mild pain:**\n• Rest the affected area\n• Apply ice (first 48hrs) then heat\n• Gentle stretching\n• OTC pain relievers\n\n**See a doctor if:**\n• Pain after injury or fall\n• Numbness or tingling\n• Pain at night or at rest\n• No improvement after 2 weeks\n\n**Recommended Specialist:** Orthopedic Surgeon / Physiotherapist",
      hi: "मांसपेशियों और हड्डियों का दर्द बहुत सामान्य है। यहां मार्गदर्शन:\n\n**हल्के दर्द के लिए:**\n• प्रभावित क्षेत्र को आराम दें\n• पहले 48 घंटे बर्फ, फिर गर्मी लगाएं\n• हल्की स्ट्रेचिंग\n• OTC दर्द निवारक\n\n**डॉक्टर के पास जाएं यदि:**\n• चोट या गिरने के बाद दर्द\n• सुन्नता या झुनझुनी\n• रात में या आराम के दौरान दर्द\n• 2 सप्ताह के बाद भी कोई सुधार नहीं\n\n**अनुशंसित विशेषज्ञ:** ऑर्थोपेडिक सर्जन / फिजियोथेरेपिस्ट",
      te: "కండరాలు మరియు ఎముకల నొప్పి చాలా సాధారణం. ఇక్కడ మార్గదర్శిని:\n\n**తేలికపాటి నొప్పికి:**\n• ప్రభావిత ప్రాంతానికి విశ్రాంతి ఇవ్వండి\n• మొదటి 48 గంటలు మంచు, తర్వాత వేడి వేయండి\n• సున్నితమైన స్ట్రెచింగ్\n• OTC నొప్పి నివారణలు\n\n**డాక్టర్‌ను సంప్రదించండి:**\n• గాయం లేదా పడిపోయిన తర్వాత నొప్పి\n• తిమ్మిరి లేదా జలదరింపు\n• రాత్రి లేదా విశ్రాంతి సమయంలో నొప్పి\n• 2 వారాల తర్వాత మెరుగుదల లేదు\n\n**సూచించిన నిపుణుడు:** ఆర్థోపెడిక్ సర్జన్ / ఫిజియోథెరపిస్ట్",
    },
    suggestions: {
      en: ['Book orthopedic', 'Book general physician'],
      hi: ['ऑर्थोपेडिक बुक करें', 'सामान्य चिकित्सक बुक करें'],
      te: ['ఆర్థోపెడిక్ బుక్ చేయండి', 'సాధారణ వైద్యుడిని బుక్ చేయండి'],
    },
  },

  // Symptoms - Skin
  {
    keywords: ['skin', 'rash', 'itching', 'itch', 'acne', 'pimple', 'eczema', 'psoriasis', 'allergy', 'hives',
      'त्वचा', 'दाने', 'खुजली', 'मुंहासे', 'एलर्जी',
      'చర్మం', 'దద్దుర్లు', 'దురద', 'మొటిమలు', 'అలెర్జీ'],
    responses: {
      en: "Skin conditions vary widely. Here's a quick overview:\n\n**Common conditions:**\n• Eczema/Dermatitis — dry, itchy patches\n• Allergic rash — hives, redness after exposure\n• Acne — blocked pores and inflammation\n• Fungal infection — ring-like patterns\n\n**When to see a doctor:**\n• Rash spreading rapidly\n• Rash with fever\n• Open sores or blisters\n• Severe itching disrupting sleep\n\n**Recommended Specialist:** Dermatologist",
      hi: "त्वचा की स्थितियां विभिन्न होती हैं। यहां एक त्वरित अवलोकन:\n\n**सामान्य स्थितियां:**\n• एक्जिमा/डर्मेटाइटिस — सूखे, खुजली वाले पैच\n• एलर्जिक दाने — पित्ती, संपर्क के बाद लालिमा\n• मुंहासे — बंद रोमछिद्र और सूजन\n• फंगल संक्रमण — रिंग जैसे पैटर्न\n\n**डॉक्टर के पास जाएं यदि:**\n• दाने तेजी से फैल रहे हों\n• बुखार के साथ दाने\n• खुले घाव या छाले\n• नींद में खलल डालने वाली तीव्र खुजली\n\n**अनुशंसित विशेषज्ञ:** डर्मेटोलॉजिस्ट",
      te: "చర్మ పరిస్థితులు విభిన్నంగా ఉంటాయి. ఇక్కడ ఒక త్వరిత అవలోకనం:\n\n**సాధారణ పరిస్థితులు:**\n• ఎగ్జిమా/డర్మటైటిస్ — పొడి, దురద పాచెస్\n• అలెర్జిక్ దద్దుర్లు — గుళికలు, ఎరుపు\n• మొటిమలు — మూసుకుపోయిన రంధ్రాలు మరియు వాపు\n• ఫంగల్ ఇన్ఫెక్షన్ — రింగ్ లాంటి నమూనాలు\n\n**డాక్టర్‌ను సంప్రదించండి:**\n• దద్దుర్లు వేగంగా వ్యాపిస్తున్నప్పుడు\n• జ్వరంతో దద్దుర్లు\n• తెరుచుకున్న గాయాలు లేదా బొబ్బలు\n• నిద్రకు ఆటంకం కలిగించే తీవ్రమైన దురద\n\n**సూచించిన నిపుణుడు:** డర్మటాలజిస్ట్",
    },
    suggestions: {
      en: ['Book dermatologist', 'Check symptoms'],
      hi: ['डर्मेटोलॉजिस्ट बुक करें', 'लक्षण जांचें'],
      te: ['డర్మటాలజిస్ట్ బుక్ చేయండి', 'లక్షణాలు తనిఖీ'],
    },
  },

  // Mental health
  {
    keywords: ['depression', 'anxiety', 'stress', 'mental health', 'sleep', 'insomnia',
      'panic', 'mood', 'sad', 'hopeless', 'suicidal',
      'अवसाद', 'चिंता', 'तनाव', 'मानसिक स्वास्थ्य', 'नींद', 'उनींदापन',
      'నిరాశ', 'ఆందోళన', 'ఒత్తిడి', 'మానసిక ఆరోగ్యం', 'నిద్ర', 'నిద్రలేమి'],
    responses: {
      en: "Mental health matters just as much as physical health. You're not alone.\n\n**Immediate help:**\n• iCall helpline: 9152987821\n• Vandrevala Foundation: 1860-2662-345 (24/7)\n• NIMHANS: 080-46110007\n\n**What I can help with:**\n• Book an appointment with a psychiatrist or psychologist\n• Connect you with a counselor\n\nTalking to a professional is a sign of strength. Would you like help finding a mental health specialist?",
      hi: "मानसिक स्वास्थ्य शारीरिक स्वास्थ्य जितना ही महत्वपूर्ण है। आप अकेले नहीं हैं।\n\n**तत्काल सहायता:**\n• iCall हेल्पलाइन: 9152987821\n• Vandrevala Foundation: 1860-2662-345 (24/7)\n• NIMHANS: 080-46110007\n\n**मैं इसमें मदद कर सकता हूं:**\n• मनोचिकित्सक या मनोवैज्ञानिक के साथ अपॉइंटमेंट बुक करें\n• काउंसलर से जोड़ें\n\nकिसी पेशेवर से बात करना ताकत की निशानी है। क्या मानसिक स्वास्थ्य विशेषज्ञ खोजने में मदद चाहिए?",
      te: "మానసిక ఆరోగ్యం శారీరక ఆరోగ్యంతో సమానంగా ముఖ్యమైనది. మీరు ఒంటరిగా లేరు.\n\n**తక్షణ సహాయం:**\n• iCall హెల్ప్‌లైన్: 9152987821\n• Vandrevala Foundation: 1860-2662-345 (24/7)\n• NIMHANS: 080-46110007\n\n**నేను సహాయపడగలను:**\n• మానసిక వైద్యుడు లేదా మనస్తత్వవేత్తతో అపాయింట్‌మెంట్ బుక్ చేయండి\n• కౌన్సెలర్‌తో అనుసంధానించండి\n\nనిపుణుడితో మాట్లాడడం బలానికి సంకేతం. మానసిక ఆరోగ్య నిపుణుడిని కనుగొనడంలో సహాయం కావాలా?",
    },
    suggestions: {
      en: ['Book psychiatrist', 'Find counselor'],
      hi: ['मनोचिकित्सक बुक करें', 'काउंसलर खोजें'],
      te: ['మానసిక వైద్యుడిని బుక్ చేయండి', 'కౌన్సెలర్ కనుగొనండి'],
    },
  },

  // Reports
  {
    keywords: ['report', 'medical record', 'test result', 'lab result', 'scan', 'x-ray', 'mri', 'blood test', 'upload report',
      'रिपोर्ट', 'मेडिकल रिकॉर्ड', 'टेस्ट', 'एक्स-रे', 'खून की जांच',
      'నివేదిక', 'వైద్య రికార్డు', 'పరీక్ష ఫలితం', 'ఎక్స్-రే', 'రక్త పరీక్ష'],
    responses: {
      en: "Managing your medical reports is easy on MediQueue!\n\n**What you can do:**\n• Upload reports from your **Reports** page\n• AI analyzes your reports for key insights\n• Share reports with your doctor during consultation\n• All reports stored securely in your account\n\n**Supported formats:** PDF, JPG, PNG\n\nWould you like to go to your Reports page?",
      hi: "MediQueue पर अपनी मेडिकल रिपोर्ट प्रबंधित करना आसान है!\n\n**आप क्या कर सकते हैं:**\n• अपने **रिपोर्ट** पेज से रिपोर्ट अपलोड करें\n• AI आपकी रिपोर्ट का विश्लेषण करता है\n• परामर्श के दौरान रिपोर्ट डॉक्टर के साथ साझा करें\n• सभी रिपोर्ट आपके खाते में सुरक्षित रूप से संग्रहीत हैं\n\n**समर्थित प्रारूप:** PDF, JPG, PNG\n\nक्या आप अपने रिपोर्ट पेज पर जाना चाहते हैं?",
      te: "MediQueueలో మీ వైద్య నివేదికలను నిర్వహించడం సులభం!\n\n**మీరు ఏమి చేయవచ్చు:**\n• మీ **నివేదికలు** పేజీ నుండి నివేదికలు అప్‌లోడ్ చేయండి\n• AI మీ నివేదికలను విశ్లేషిస్తుంది\n• సంప్రదింపు సమయంలో డాక్టర్‌తో నివేదికలు పంచుకోండి\n• అన్ని నివేదికలు మీ ఖాతాలో సురక్షితంగా నిల్వ చేయబడతాయి\n\n**మద్దతు ఉన్న ఫార్మాట్‌లు:** PDF, JPG, PNG\n\nమీ నివేదికలు పేజీకి వెళ్లాలనుకుంటున్నారా?",
    },
    suggestions: {
      en: ['Go to Reports', 'Book appointment', 'Check AI analysis'],
      hi: ['रिपोर्ट पेज पर जाएं', 'अपॉइंटमेंट बुक करें', 'AI विश्लेषण देखें'],
      te: ['నివేదికలు పేజీకి వెళ్లండి', 'అపాయింట్‌మెంట్ బుక్ చేయండి', 'AI విశ్లేషణ చూడండి'],
    },
  },

  // Prescription / Medicine
  {
    keywords: ['prescription', 'medicine', 'medication', 'tablet', 'drug', 'dose',
      'दवा', 'दवाई', 'पर्चा', 'गोली', 'खुराक',
      'మందు', 'ప్రిస్క్రిప్షన్', 'మాత్ర', 'డోసు'],
    responses: {
      en: "For prescriptions and medications:\n\n**On MediQueue:**\n• Doctors issue digital prescriptions after consultation\n• Find prescriptions in your **Reports** page\n• Share prescriptions directly at pharmacies\n\n**Important:** Never self-medicate based on online advice. Always follow your doctor's prescription.\n\nNeed help finding a doctor to get a prescription?",
      hi: "नुस्खे और दवाओं के लिए:\n\n**MediQueue पर:**\n• डॉक्टर परामर्श के बाद डिजिटल नुस्खे जारी करते हैं\n• अपने **रिपोर्ट** पेज में नुस्खे खोजें\n• नुस्खे सीधे फार्मेसी में साझा करें\n\n**महत्वपूर्ण:** ऑनलाइन सलाह के आधार पर कभी भी स्व-दवा न करें। हमेशा अपने डॉक्टर के नुस्खे का पालन करें।\n\nक्या नुस्खा लेने के लिए डॉक्टर खोजने में मदद चाहिए?",
      te: "ప్రిస్క్రిప్షన్లు మరియు మందులకు:\n\n**MediQueueలో:**\n• సంప్రదింపు తర్వాత డాక్టర్లు డిజిటల్ ప్రిస్క్రిప్షన్లు జారీ చేస్తారు\n• మీ **నివేదికలు** పేజీలో ప్రిస్క్రిప్షన్లు కనుగొనండి\n• ప్రిస్క్రిప్షన్లు నేరుగా ఫార్మసీలలో పంచుకోండి\n\n**ముఖ్యమైనది:** ఆన్‌లైన్ సలహా ఆధారంగా స్వయంగా మందులు వాడకండి. ఎల్లప్పుడూ మీ డాక్టర్ ప్రిస్క్రిప్షన్ అనుసరించండి.\n\nప్రిస్క్రిప్షన్ పొందడానికి డాక్టర్ కనుగొనడంలో సహాయం కావాలా?",
    },
    suggestions: {
      en: ['Book appointment', 'View my reports'],
      hi: ['अपॉइंटमेंट बुक करें', 'मेरी रिपोर्ट देखें'],
      te: ['అపాయింట్‌మెంట్ బుక్ చేయండి', 'నా నివేదికలు చూడండి'],
    },
  },

  // Cost / Fee
  {
    keywords: ['cost', 'fee', 'price', 'charge', 'payment', 'how much', 'consultation fee', 'free',
      'शुल्क', 'कीमत', 'भुगतान', 'कितना', 'परामर्श शुल्क',
      'రుసుము', 'ధర', 'చెల్లింపు', 'ఎంత', 'సంప్రదింపు రుసుము'],
    responses: {
      en: "Consultation fees on MediQueue:\n\n• Each doctor sets their own consultation fee\n• Fees are clearly displayed on the doctor's profile before booking\n• Fee range varies by specialization and experience\n\n**To see fees:**\nGo to Doctors page → Select a doctor → View consultation fee\n\nWould you like to browse doctors and their fees?",
      hi: "MediQueue पर परामर्श शुल्क:\n\n• प्रत्येक डॉक्टर अपना परामर्श शुल्क निर्धारित करता है\n• बुकिंग से पहले डॉक्टर के प्रोफाइल पर शुल्क स्पष्ट रूप से दिखाई देता है\n• शुल्क विशेषज्ञता और अनुभव के अनुसार भिन्न होता है\n\n**शुल्क देखने के लिए:**\nडॉक्टर पेज पर जाएं → डॉक्टर चुनें → परामर्श शुल्क देखें\n\nक्या आप डॉक्टरों और उनके शुल्क ब्राउज़ करना चाहते हैं?",
      te: "MediQueueలో సంప్రదింపు రుసుమాలు:\n\n• ప్రతి డాక్టర్ తమ స్వంత సంప్రదింపు రుసుమును నిర్ణయిస్తారు\n• బుకింగ్‌కు ముందు డాక్టర్ ప్రొఫైల్‌లో రుసుమాలు స్పష్టంగా చూపబడతాయి\n• రుసుము ప్రత్యేకత మరియు అనుభవం ఆధారంగా మారుతుంది\n\n**రుసుమాలు చూడటానికి:**\nడాక్టర్లు పేజీకి వెళ్లండి → డాక్టర్ ఎంచుకోండి → సంప్రదింపు రుసుము చూడండి\n\nడాక్టర్లు మరియు వారి రుసుమాలను బ్రౌజ్ చేయాలనుకుంటున్నారా?",
    },
    suggestions: {
      en: ['Browse doctors', 'Book appointment'],
      hi: ['डॉक्टर देखें', 'अपॉइंटमेंट बुक करें'],
      te: ['డాక్టర్లు బ్రౌజ్ చేయండి', 'అపాయింట్‌మెంట్ బుక్ చేయండి'],
    },
  },

  // Diabetes
  {
    keywords: ['diabetes', 'blood sugar', 'insulin', 'glucose', 'sugar level', 'hyperglycemia', 'hypoglycemia',
      'मधुमेह', 'शुगर', 'इंसुलिन', 'ब्लड शुगर',
      'మధుమేహం', 'చక్కెర', 'ఇన్సులిన్', 'రక్తంలో చక్కెర'],
    responses: {
      en: "Managing diabetes requires regular monitoring and care:\n\n**Symptoms to watch:**\n• Frequent urination, excessive thirst\n• Unexplained weight loss\n• Blurry vision, slow healing wounds\n• Tingling in hands/feet\n\n**Regular checkups needed:**\n• Blood glucose monitoring\n• HbA1c every 3 months\n• Annual eye and kidney checkup\n\n**Recommended Specialist:** Endocrinologist / Diabetologist",
      hi: "मधुमेह के प्रबंधन के लिए नियमित निगरानी और देखभाल आवश्यक है:\n\n**देखने योग्य लक्षण:**\n• बार-बार पेशाब, अत्यधिक प्यास\n• अस्पष्टीकृत वजन कम होना\n• धुंधली दृष्टि, धीरे ठीक होने वाले घाव\n• हाथों/पैरों में झुनझुनी\n\n**नियमित जांच आवश्यक:**\n• ब्लड ग्लूकोज निगरानी\n• हर 3 महीने HbA1c\n• वार्षिक आंख और किडनी जांच\n\n**अनुशंसित विशेषज्ञ:** एंडोक्रिनोलॉजिस्ट / डायबेटोलॉजिस्ट",
      te: "మధుమేహం నిర్వహణకు క్రమం తప్పకుండా పర్యవేక్షణ మరియు సంరక్షణ అవసరం:\n\n**చూడవలసిన లక్షణాలు:**\n• తరచుగా మూత్రవిసర్జన, అధిక దాహం\n• వివరించలేని బరువు తగ్గడం\n• అస్పష్ట దృష్టి, నెమ్మదిగా నయమయ్యే గాయాలు\n• చేతులు/పాదాలలో జలదరింపు\n\n**క్రమం తప్పకుండా తనిఖీలు:**\n• రక్తంలో గ్లూకోజ్ పర్యవేక్షణ\n• ప్రతి 3 నెలలకు HbA1c\n• వార్షిక కన్ను మరియు మూత్రపిండ తనిఖీ\n\n**సూచించిన నిపుణుడు:** ఎండోక్రినాలజిస్ట్ / డయాబెటాలజిస్ట్",
    },
    suggestions: {
      en: ['Book endocrinologist', 'Upload blood report'],
      hi: ['एंडोक्रिनोलॉजिस्ट बुक करें', 'ब्लड रिपोर्ट अपलोड करें'],
      te: ['ఎండోక్రినాలజిస్ట్ బుక్ చేయండి', 'రక్త నివేదిక అప్‌లోడ్ చేయండి'],
    },
  },

  // Blood pressure
  {
    keywords: ['blood pressure', 'hypertension', 'high bp', 'low bp', 'bp high', 'bp low',
      'रक्तचाप', 'बीपी', 'उच्च रक्तचाप', 'निम्न रक्तचाप',
      'రక్తపోటు', 'బీపీ', 'అధిక రక్తపోటు', 'తక్కువ రక్తపోటు'],
    responses: {
      en: "Blood pressure management is crucial for heart health:\n\n**Normal BP:** Less than 120/80 mmHg\n**High BP (Hypertension):** 130/80 mmHg or higher\n**Low BP (Hypotension):** Below 90/60 mmHg\n\n**Symptoms of high BP:**\n• Headache, dizziness, nosebleed\n• Often no symptoms — 'silent killer'\n\n**Tips:** Reduce salt, exercise regularly, manage stress, take prescribed medications\n\n**Recommended Specialist:** Cardiologist / General Physician",
      hi: "रक्तचाप प्रबंधन हृदय स्वास्थ्य के लिए महत्वपूर्ण है:\n\n**सामान्य BP:** 120/80 mmHg से कम\n**उच्च BP (हाइपरटेंशन):** 130/80 mmHg या अधिक\n**निम्न BP (हाइपोटेंशन):** 90/60 mmHg से कम\n\n**उच्च BP के लक्षण:**\n• सिरदर्द, चक्कर आना, नकसीर\n• अक्सर कोई लक्षण नहीं — 'साइलेंट किलर'\n\n**सुझाव:** नमक कम करें, नियमित व्यायाम करें, तनाव प्रबंधित करें\n\n**अनुशंसित विशेषज्ञ:** हृदय रोग विशेषज्ञ / सामान्य चिकित्सक",
      te: "రక్తపోటు నిర్వహణ హృదయ ఆరోగ్యానికి చాలా ముఖ్యమైనది:\n\n**సాధారణ BP:** 120/80 mmHg కంటే తక్కువ\n**అధిక BP (హైపర్టెన్షన్):** 130/80 mmHg లేదా ఎక్కువ\n**తక్కువ BP (హైపోటెన్షన్):** 90/60 mmHg కంటే తక్కువ\n\n**అధిక BP లక్షణాలు:**\n• తలనొప్పి, తల తిరగడం, ముక్కు నుండి రక్తం\n• తరచుగా లక్షణాలు లేవు — 'సైలెంట్ కిల్లర్'\n\n**చిట్కాలు:** ఉప్పు తగ్గించండి, క్రమంగా వ్యాయామం చేయండి, ఒత్తిడి నిర్వహించండి\n\n**సూచించిన నిపుణుడు:** హృద్రోగ నిపుణుడు / సాధారణ వైద్యుడు",
    },
    suggestions: {
      en: ['Book cardiologist', 'Book general physician'],
      hi: ['कार्डियोलॉजिस्ट बुक करें', 'सामान्य चिकित्सक बुक करें'],
      te: ['కార్డియాలజిస్ట్ బుక్ చేయండి', 'సాధారణ వైద్యుడిని బుక్ చేయండి'],
    },
  },

  // Thank you
  {
    keywords: ['thank', 'thanks', 'thank you', 'thx', 'appreciate',
      'धन्यवाद', 'शुक्रिया', 'बहुत बहुत धन्यवाद',
      'ధన్యవాదాలు', 'థాంక్యూ', 'చాలా ధన్యవాదాలు'],
    responses: {
      en: "You're very welcome! I'm always here to help with your health queries.\n\nStay healthy and don't hesitate to reach out if you need anything else!",
      hi: "बहुत स्वागत है! मैं हमेशा आपके स्वास्थ्य संबंधी प्रश्नों में मदद के लिए यहां हूं।\n\nस्वस्थ रहें और अगर कुछ और चाहिए तो संकोच न करें!",
      te: "మీకు స్వాగతం! నేను ఎల్లప్పుడూ మీ ఆరోగ్య సంబంధిత ప్రశ్నలకు సహాయపడటానికి ఇక్కడ ఉన్నాను.\n\nఆరోగ్యంగా ఉండండి మరియు మరేదైనా అవసరమైతే వెంటనే అడగండి!",
    },
    suggestions: {
      en: ['Book appointment', 'Find a doctor', 'Check symptoms'],
      hi: ['अपॉइंटमेंट बुक करें', 'डॉक्टर खोजें', 'लक्षण जांचें'],
      te: ['అపాయింట్‌మెంట్ బుక్ చేయండి', 'డాక్టర్ కనుగొనండి', 'లక్షణాలు తనిఖీ'],
    },
  },

  // Goodbye
  {
    keywords: ['bye', 'goodbye', 'see you', 'take care',
      'अलविदा', 'बाय', 'फिर मिलेंगे', 'ध्यान रखें',
      'వెళ్ళొస్తాను', 'బై', 'మళ్ళీ కలుద్దాం', 'జాగ్రత్తగా ఉండండి'],
    responses: {
      en: "Take care and stay healthy! Remember, I'm always here if you need health guidance. Goodbye!",
      hi: "ध्यान रखें और स्वस्थ रहें! याद रखें, अगर स्वास्थ्य मार्गदर्शन की जरूरत हो तो मैं हमेशा यहां हूं। अलविदा!",
      te: "జాగ్రత్తగా ఉండండి మరియు ఆరోగ్యంగా ఉండండి! గుర్తుంచుకోండి, ఆరోగ్య మార్గదర్శకత్వం అవసరమైతే నేను ఎల్లప్పుడూ ఇక్కడ ఉన్నాను. వెళ్ళొస్తాను!",
    },
    suggestions: { en: [], hi: [], te: [] },
  },
];

const UI_TEXT = {
  en: {
    online: 'Online — here to help',
    welcome: "Hello! I'm MediQueue Assistant. I can help you book appointments, find doctors, check symptoms, and more.\n\nHow can I help you today?",
    welcomeSuggestions: ['Book an appointment', 'Find a doctor', 'Check symptoms', 'Find hospitals'],
    cleared: 'Chat cleared. How can I help you today?',
    clearedSuggestions: ['Book appointment', 'Find a doctor', 'Check symptoms'],
    placeholder: 'Type your question...',
    fallback: "I'm not sure about that specific query, but I'm here to help with:\n\n• **Booking appointments** — Find and book doctors\n• **Finding hospitals** — Locate nearby hospitals\n• **Symptom guidance** — Describe symptoms for advice\n• **Medical reports** — Upload and review reports\n• **Doctor profiles** — View specialists and fees\n\nCould you rephrase your question or choose one of the options below?",
    fallbackSuggestions: ['Book appointment', 'Find a doctor', 'Check symptoms', 'Find hospitals'],
  },
  hi: {
    online: 'ऑनलाइन — मदद के लिए यहां हूं',
    welcome: "नमस्ते! मैं MediQueue सहायक हूं। मैं अपॉइंटमेंट बुक करने, डॉक्टर खोजने, लक्षण जांचने और बहुत कुछ में मदद कर सकता हूं।\n\nआज मैं आपकी किस तरह मदद कर सकता हूं?",
    welcomeSuggestions: ['अपॉइंटमेंट बुक करें', 'डॉक्टर खोजें', 'लक्षण जांचें', 'अस्पताल खोजें'],
    cleared: 'चैट साफ हो गई। आज मैं आपकी किस तरह मदद कर सकता हूं?',
    clearedSuggestions: ['अपॉइंटमेंट बुक करें', 'डॉक्टर खोजें', 'लक्षण जांचें'],
    placeholder: 'अपना सवाल लिखें...',
    fallback: "मुझे उस विशिष्ट प्रश्न के बारे में निश्चित नहीं है, लेकिन मैं इसमें मदद कर सकता हूं:\n\n• **अपॉइंटमेंट बुकिंग** — डॉक्टर खोजें और बुक करें\n• **अस्पताल खोजें** — नजदीकी अस्पताल खोजें\n• **लक्षण मार्गदर्शन** — लक्षण बताएं सलाह पाएं\n• **मेडिकल रिपोर्ट** — रिपोर्ट अपलोड और समीक्षा करें\n\nक्या आप अपना प्रश्न फिर से लिख सकते हैं या नीचे से एक विकल्प चुन सकते हैं?",
    fallbackSuggestions: ['अपॉइंटमेंट बुक करें', 'डॉक्टर खोजें', 'लक्षण जांचें', 'अस्पताल खोजें'],
  },
  te: {
    online: 'ఆన్‌లైన్ — సహాయపడటానికి ఇక్కడ ఉన్నాను',
    welcome: "నమస్కారం! నేను MediQueue సహాయకుడిని. అపాయింట్‌మెంట్‌లు బుక్ చేయడం, డాక్టర్లను కనుగొనడం, లక్షణాలను తనిఖీ చేయడం మరియు మరెన్నో సహాయపడగలను.\n\nఈరోజు నేను మీకు ఎలా సహాయపడగలను?",
    welcomeSuggestions: ['అపాయింట్‌మెంట్ బుక్ చేయండి', 'డాక్టర్ కనుగొనండి', 'లక్షణాలు తనిఖీ', 'ఆసుపత్రి కనుగొనండి'],
    cleared: 'చాట్ క్లియర్ చేయబడింది. ఈరోజు నేను మీకు ఎలా సహాయపడగలను?',
    clearedSuggestions: ['అపాయింట్‌మెంట్ బుక్ చేయండి', 'డాక్టర్ కనుగొనండి', 'లక్షణాలు తనిఖీ'],
    placeholder: 'మీ ప్రశ్న టైప్ చేయండి...',
    fallback: "ఆ నిర్దిష్ట ప్రశ్న గురించి నాకు ఖచ్చితంగా తెలియదు, కానీ నేను ఇవి సహాయపడగలను:\n\n• **అపాయింట్‌మెంట్ బుకింగ్** — డాక్టర్లను కనుగొని బుక్ చేయండి\n• **ఆసుపత్రి కనుగొనడం** — సమీప ఆసుపత్రులు\n• **లక్షణ మార్గదర్శకత్వం** — లక్షణాలు వివరించి సలహా పొందండి\n• **వైద్య నివేదికలు** — నివేదికలు అప్‌లోడ్ చేయండి\n\nమీ ప్రశ్నను మళ్ళీ అడగగలరా లేదా క్రింది ఎంపికలలో ఒకటి ఎంచుకోగలరా?",
    fallbackSuggestions: ['అపాయింట్‌మెంట్ బుక్ చేయండి', 'డాక్టర్ కనుగొనండి', 'లక్షణాలు తనిఖీ', 'ఆసుపత్రి కనుగొనండి'],
  },
};

function getAIResponse(message: string, language: Language): { response: string; suggestions: string[] } {
  const lower = message.toLowerCase();
  const lang = language as keyof typeof UI_TEXT;

  for (const rule of RULES) {
    if (rule.keywords.some(kw => lower.includes(kw))) {
      return {
        response: rule.responses[lang] ?? rule.responses.en,
        suggestions: rule.suggestions[lang] ?? rule.suggestions.en,
      };
    }
  }

  const ui = UI_TEXT[lang] ?? UI_TEXT.en;
  return { response: ui.fallback, suggestions: ui.fallbackSuggestions };
}

export function Chatbot() {
  const { language } = useLanguage();
  const lang = language as keyof typeof UI_TEXT;
  const ui = UI_TEXT[lang] ?? UI_TEXT.en;

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset chat when language changes
  useEffect(() => {
    const currentUi = UI_TEXT[language as keyof typeof UI_TEXT] ?? UI_TEXT.en;
    setMessages([{
      id: 'welcome-' + language,
      role: 'assistant',
      content: currentUi.welcome,
      timestamp: new Date(),
      suggestions: currentUi.welcomeSuggestions,
    }]);
  }, [language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  useEffect(() => {
    const open = () => setIsOpen(true);
    window.addEventListener('openChatbot', open);
    return () => window.removeEventListener('openChatbot', open);
  }, []);

  const sendMessage = (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const { response, suggestions } = getAIResponse(userMsg.content, language);
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        suggestions,
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
      if (voiceEnabled) speak(response.replace(/\*\*/g, '').replace(/•/g, '').replace(/\n/g, '. '));
    }, 600 + Math.random() * 600);
  };

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const doSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const utterance = new SpeechSynthesisUtterance(text.slice(0, 300));
      utterance.rate = 0.9;

      if (language === 'te') {
        // Prefer te-IN, fall back to any Telugu voice, then en-IN
        const teVoice =
          voices.find(v => v.lang === 'te-IN') ||
          voices.find(v => v.lang.startsWith('te'));
        if (teVoice) {
          utterance.voice = teVoice;
          utterance.lang = teVoice.lang;
        } else {
          // No Telugu voice on this device — use English voice with en-IN lang
          const enVoice = voices.find(v => v.lang === 'en-IN') || voices.find(v => v.lang.startsWith('en'));
          if (enVoice) utterance.voice = enVoice;
          utterance.lang = 'en-IN';
        }
      } else if (language === 'hi') {
        const hiVoice =
          voices.find(v => v.lang === 'hi-IN') ||
          voices.find(v => v.lang.startsWith('hi'));
        if (hiVoice) {
          utterance.voice = hiVoice;
          utterance.lang = hiVoice.lang;
        } else {
          utterance.lang = 'hi-IN';
        }
      } else {
        const enVoice = voices.find(v => v.lang === 'en-IN') || voices.find(v => v.lang.startsWith('en'));
        if (enVoice) utterance.voice = enVoice;
        utterance.lang = 'en-IN';
      }

      window.speechSynthesis.speak(utterance);
    };

    // Voices may not be loaded yet on first call
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      doSpeak();
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', doSpeak, { once: true });
    }
  };

  const startVoiceInput = () => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => setInput(event.results[0][0].transcript);
    recognition.onerror = (event: any) => {
      // If te-IN not supported by browser, fall back to en-US
      if (event.error === 'language-not-supported' && language === 'te') {
        const fallback = new SR();
        fallback.lang = 'en-US';
        fallback.onresult = (e: any) => setInput(e.results[0][0].transcript);
        fallback.start();
      }
    };
    recognition.start();
  };

  const clearChat = () => {
    const currentUi = UI_TEXT[language as keyof typeof UI_TEXT] ?? UI_TEXT.en;
    setMessages([{
      id: 'cleared-' + Date.now(),
      role: 'assistant',
      content: currentUi.cleared,
      timestamp: new Date(),
      suggestions: currentUi.clearedSuggestions,
    }]);
  };

  const formatContent = (text: string) =>
    text.split('\n').map((line, i) => (
      <span key={i} className="block"
        dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') || '&nbsp;' }}
      />
    ));

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/40 flex items-center justify-center"
      >
        <AnimatePresence mode="wait">
          {isOpen
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X className="w-6 h-6" /></motion.div>
            : <motion.div key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><Bot className="w-6 h-6" /></motion.div>
          }
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-[390px] max-w-[calc(100vw-48px)]"
          >
            <NeumorphCard className="p-0 overflow-hidden" hover={false}>
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-primary to-primary-dark text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">MediQueue Assistant</h3>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-xs text-white/80">{ui.online}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={clearChat} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" title="Clear chat">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setVoiceEnabled(!voiceEnabled)}
                      className={`p-2 rounded-lg transition-colors ${voiceEnabled ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'}`}
                    >
                      {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="h-[360px] overflow-y-auto p-4 space-y-4 bg-background/50">
                {messages.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start gap-2 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        msg.role === 'user' ? 'bg-primary/10' : 'bg-gradient-to-br from-primary to-secondary'
                      }`}>
                        {msg.role === 'user' ? <User className="w-3.5 h-3.5 text-primary" /> : <Bot className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div className="space-y-2 min-w-0">
                        <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-r from-primary to-primary-dark text-white rounded-tr-md'
                            : 'bg-surface shadow-neumorph text-text-primary rounded-tl-md'
                        }`}>
                          {msg.role === 'assistant' ? formatContent(msg.content) : msg.content}
                        </div>
                        {msg.role === 'assistant' && msg.suggestions && msg.suggestions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {msg.suggestions.map(s => (
                              <button
                                key={s}
                                onClick={() => sendMessage(s)}
                                disabled={isTyping}
                                className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="p-3 rounded-2xl bg-surface shadow-neumorph text-text-primary rounded-tl-md">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-slate-100 bg-surface">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                      placeholder={ui.placeholder}
                      className="w-full pl-3 pr-9 py-2.5 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm"
                    />
                    <button
                      onClick={startVoiceInput}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary transition-colors"
                      title="Voice input"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || isTyping}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/30 hover:shadow-xl disabled:opacity-40 disabled:shadow-none transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </NeumorphCard>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
