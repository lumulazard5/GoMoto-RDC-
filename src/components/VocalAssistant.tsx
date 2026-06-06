/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Volume2, VolumeX, Play, Square, Headphones, Sparkles, Languages, HelpCircle } from "lucide-react";
import { AppLanguage } from "../lib/translations";

interface GuideTopic {
  id: string;
  emoji: string;
  title: Record<AppLanguage, string>;
  text: Record<AppLanguage, string>;
}

const vocalGuidesList: GuideTopic[] = [
  {
    id: "welcome",
    emoji: "🏍️",
    title: {
      fr: "Bienvenue sur GoMoto RDC",
      en: "Welcome to GoMoto DRC",
      sw: "Karibu kwenye GoMoto RDC",
      ln: "Boyei bolamu na GoMoto RDC",
      ts: "Diledi dilalamu ku GoMoto RDC",
      kk: "Kuiza kuambote na GoMoto RDC"
    },
    text: {
      fr: "Bienvenue sur GoMoto RDC, la plateforme citoyenne qui révolutionne le taxi-moto en République Démocratique du Congo. Nous connectons en toute sécurité les passagers, les motards partenaires, et les propriétaires de flottes avec un suivi transparent certifié par l'État.",
      en: "Welcome to GoMoto DRC, the civic platform revolutionizing motorcycle taxis in the Democratic Republic of Congo. We securely connect passengers, partner riders, and fleet owners with transparent state-certified tracking.",
      sw: "Karibu kwenye GoMoto RDC, mtandao wa kiraia unaoleta mapinduzi ya teksi za pikipiki katika Jamhuri ya Kidemokrasia ya Kongo. Tunaunganisha abiria, madereva washirika, na wamiliki wa pikipiki kwa njia salama na yenye uwazi iliyoidhinishwa na Serikali.",
      ln: "Boyei bolamu na doti GoMoto RDC esaleli ya leta mpo na batakisi nkinza-ndunda na mboka Congo mobimba. Tokengeli boyokani ya mayele mpona batamboli, bamotard mpe mikolo ya motokala na bosembo nyonso.",
      ts: "Diledi dilalamu ku GoMoto RDC, mukutu wa leta udi ushintsha mushindu wa kwenda pa mutobo wa taxi nchini Congo. Tudi tuelangana ditalala ne bosembo munkatshi mwa bendi, bamotard, ne bena mutobo bua kumanya mikanda yonso.",
      kk: "Kuiza kuambote na GoMoto RDC, kisadilu kia mayele mpo na kubenda bansangu ya taxi-moto na kati ya ndambu ya nsi ya Kongo. Beto ke vukisaka bansanga, bamotard mpe bamvwama ya mashini na bosembo mpe kikesa."
    }
  },
  {
    id: "safety",
    emoji: "🛡️",
    title: {
      fr: "Sécurité & Double Casque",
      en: "Security & Double Helmets",
      sw: "Usalama na Kofia Mbili Ngumu",
      ln: "Kimya mpe Bikoti Mibale ya Mutari",
      ts: "Ditalala ne Bifulu Bibale dya Leta",
      kk: "Luvuvamu mpe Mikokoso Mivale ya Leta"
    },
    text: {
      fr: "La sécurité est notre priorité absolue. En République Démocratique du Congo, la loi exige le port obligatoire du gilet rétro-réfléchissant numéroté et de deux casques homologués : un pour le motard et un pour le passager citoyen. Roulez équipé, roulez protégé !",
      en: "Security is our absolute priority. In the Democratic Republic of Congo, the law strictly mandates wearing a numbered high-visibility vest and two certified helmets: one for the rider and one for the passenger citizen. Ride equipped, ride protected!",
      sw: "Usalama ni kipaumbele chetu kikuu. Katika Jamhuri ya Kidemokrasia ya Kongo, sheria inalazimisha uvaaji wa koti la kuakisi mionzi lenye namba na kofia mbili ngumu zilizoidhinishwa: moja ya dereva na nyingine ya mwananchi abiria. Endesha ukiwa tayari, endesha ukiwa umelindwa!",
      ln: "Batela kimia na balabala. Mibeko ya mboka Congo itindi motard mpe mofuti na ye balata ekoti ya molonge mbala moko, mpe gilet ya kongenga tango nyonso ya butu to ya moyi. Kumba na kimia, kumba na mayele!",
      ts: "Ditalala pa nshila dya leta. Mibelu ya kukuata mutobo idi ilomba bidimukilu bia kulata gilet ya leta ne bifulu bibale bia ditalala: tshimue bua muendesi, tshinene bua muendi mutobo. Kwendayi ne ditalala, luvuvamu ludi kumpala!",
      kk: "Luvuvamu kuna nzila. Minsiku ya leta ke lombaka kulata gilet ti nimelo ya leta, mpe kukaba nkokoso mivale ya zulu: mosi mpo na mwendesi, yaka ya zole mpo na nzenza. Diata na mbote, diata na luvuvamu ya nene!"
    }
  },
  {
    id: "escrow",
    emoji: "💵",
    title: {
      fr: "Paiement upfront et Escrow REPARO",
      en: "Upfront Payment and REPARO Escrow",
      sw: "Malipo ya Awali na Escrow REPARO",
      ln: "Kofuta Liboso mpe Kasa REPARO",
      ts: "Difutu dya kumpala ne Diteba REPARO",
      kk: "Kufuta ntinu mpe Kidiba REPARO"
    },
    text: {
      fr: "Pour éliminer les litiges et sécuriser la rémunération des motards, GoMoto utilise un système de consignation légale d'État nommé REPARO. Le montant de la course est bloqué à la commande, puis libéré à la fin : soixante-dix pourcent au motard, quinze pourcent au propriétaire d'origine, et quinze pourcent pour la commission de maintenance.",
      en: "To eliminate disputes and secure payment for riders, GoMoto uses a state-backed escrow system called REPARO. The fare is locked when ordered, then distributed at completion: seventy percent to the rider, fifteen percent to the vehicle owner, and fifteen percent platform commission.",
      sw: "Ili kuondoa mabishano na kulinda malipo ya dereva, GoMoto inatumia mfumo wa amana uliodhaminiwa na serikali unaoitwa REPARO. Pesa ya safari hufungiwa wakati wa kuagiza na kugawanywa baada ya kukamilika: asilimia sabini kwa dereva, asilimia kumi na tano kwa mmiliki, na asilimia kumi na tano komisheni ya mtandao.",
      ln: "Mpo na kolongola nkokoso na kofuta, tokobandisa esaleli REPARO. Mosolo ekokangama na kasa ya Letat, mpe ekoleka tango course esili: motambolisi motard azuaka nkama motoba na zomi, nkolo motokala azuaka zomi na mitano, mpe esaleli ezuaka zomi na mitano mpo na bobateli.",
      ts: "Bua kujika kukandamana mu difutu, GoMoto kudi ne mukutu muena ditalala udi ubikila REPARO. Makuta adi akangama mu diteba dya mbulamatadi, ne apatuka ku diongolola: bidiku makumi muanda mutoba bua muendesi, bidiku kumi ne bitano bua mvwama mutobo, ne bidiku kumi ne bitano bua leta.",
      kk: "Mpo na kufuta mbongo ya kutambula ya mbote, beto ke sadilaka kidiba ya leta yina ke bibilaka REPARO. Mbongo ke bikama na nima ya kusosa, mpe ke katula na mfuka: makumi sambanu kumi mpo na mwendesi, kumi na tanu mpo na mvwama mashini, mpe kumi na tanu mpo na kisadilu."
    }
  },
  {
    id: "disputes",
    emoji: "🚑",
    title: {
      fr: "Urgences SOS & Signalements",
      en: "Emergency SOS & Live Dispatch",
      sw: "Dharura za SOS na Polisi PNC",
      ln: "SOS ya Langu mpe Polisi PNC",
      ts: "Bikwalu SOS ne Polisi PNC dya Leta",
      kk: "Nkumbu SOS mpe Polisi PNC ya Kongo"
    },
    text: {
      fr: "En cas de danger routier, d'agression ou d'accident corporel, pressez immédiatement le bouton flotant rouge SOS. GoMoto identifie votre position GPS en temps réel sous trois secondes et transmet l'alerte à la Police Nationale Congolaise syndiquée pour un secours d'urgence.",
      en: "In case of road danger, assault, or bodily accident, immediately press the red floating SOS button. GoMoto identifies your GPS position in real-time within three seconds and dispatches the Congo National Police for urgent rescue.",
      sw: "Ukiona hatari barabarani, kushambuliwa, au ajali mbaya, bonyeza mara moja kitufe chekundu cha dharura cha SOS. GoMoto itatambua eneo lako la GPS chini ya sekunde tatu na kutuma taarifa kwa Polisi ya Kitaifa ya Kongo ili upate msaada wa haraka sana.",
      ln: "Soki likama to kobetama na nzela ezali, finá mbala moko buto ya motane SOS. GoMoto ekoluka gps na yo na mbalakaka na sekonde misato mpe ekotinda bapolisi ya PNC mpo bayela yo lisalisi noki-noki.",
      ts: "Munya ne dikandamana pa nshila nansha tshitutula, kokola mbala moko buto SOS wa muena kapia. GoMoto udi upatula coordinates dya gps mu sekonde isato nansha, ne utuma mikwalu kudi Polisi PNC bua mbulamatadi apete nshila ya mikwashu.",
      kk: "Kana kele ti mpasi, mvula ya nkele to lufwa, denda buto ya mbwaki SOS. GoMoto ke monisaka nzila ya GPS na kati ya segonda tatu mpe ke tindaka bansangu na Polisi PNC mpo na kuvukisa nge mu noki-noki."
    }
  },
  {
    id: "withdrawals",
    emoji: "📱",
    title: {
      fr: "Retraits Mobile Money",
      en: "Mobile Money Payouts",
      sw: "Utoaji Pesa kwa Simu ya Mkononi",
      ln: "Kozongisa Mosolo na Mobile Money",
      ts: "Kupata Makuta pa Simu dya Mobile Money",
      kk: "Kukatula Mbongo na Mobile Money"
    },
    text: {
      fr: "Les motards et propriétaires de flottes peuvent effectuer des retraits de leurs soldes cumulés directement sur leurs comptes de téléphonie mobile. Nous supportons les réseaux M-Pesa, Wave, Airtel Money, et Orange Money. Les demandes sont arbitrées et payées sous deux heures.",
      en: "Riders and fleet owners can withdraw their earnings directly to their mobile money accounts. We support M-Pesa, Wave, Airtel Money, and Orange Money. All requests are archived, moderated, and paid within two hours.",
      sw: "Madereva na wamiliki wanaweza kutoa pesa zao za kazi moja kwa moja kupitia huduma za simu. Tunakubali mitandao ya M-Pesa, Wave, Airtel Money, na Orange Money. Ombi lako linakaguliwa na kulipwa ndani ya masaa mawili pekee.",
      ln: "Bamotard mpe mikolo ya mashini bakoki kobimisa mbongo na bango na noki-noki na nzela ya bafilizi monene lokola M-pesa, Orange to Airtel money. Senga obimisa mbongo, mpe tokomipesa na bangonga mibale ya mosala.",
      ts: "Bamotard ne bena mutobo badi ne nshila dya kuangata makuta onso adi asombela mu diteba pa simu yabu kudi Airtel, Vodacom, to Orange. Kulupuka kua makuta kudi ne nshila wa bangonga ibale bua kuanuambila ditalala.",
      kk: "Mwendesi mpe mvwama lenda baka mbongo na kati ya mobile money yina ke mbele ti M-Pesa, Wave, Airtel to Orange Money. Bansangu nyonso ke badisaka mpe ke futulaka mbongo na kati ya bangunga zole."
    }
  }
];

interface VocalAssistantProps {
  currentLang: AppLanguage;
  onLanguageChange?: (lang: AppLanguage) => void;
}

export default function VocalAssistant({ currentLang, onLanguageChange }: VocalAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>("welcome");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [overrideLang, setOverrideLang] = useState<AppLanguage>(currentLang);
  const [transcriptText, setTranscriptText] = useState<string>("");

  // Keep overrideLang synced with global prop
  useEffect(() => {
    setOverrideLang(currentLang);
  }, [currentLang]);

  // Cancel synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const activeTopicObj = vocalGuidesList.find(t => t.id === selectedTopic) || vocalGuidesList[0];
  const activeTitle = activeTopicObj.title[overrideLang] || activeTopicObj.title["fr"];
  const activeText = activeTopicObj.text[overrideLang] || activeTopicObj.text["fr"];

  const handleSpeakGuide = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("La synthèse vocale n'est pas prise en charge par ce navigateur.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setTranscriptText("");
      return;
    }

    window.speechSynthesis.cancel();

    const textToSpeak = `${activeTitle}. ${activeText}`;
    setTranscriptText(textToSpeak);

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    // Set language locales mapped for proper vocal accent pitches
    const langCodes: Record<AppLanguage, string> = {
      fr: "fr-FR",
      en: "en-US",
      sw: "sw-KE",
      ln: "fr-CD", // fallback French CD for natural Congolese pronunciation
      ts: "fr-CD",
      kk: "fr-CD"
    };

    utterance.lang = langCodes[overrideLang] || "fr-FR";
    utterance.rate = playbackRate;

    if (window.speechSynthesis.getVoices) {
      const voices = window.speechSynthesis.getVoices();
      // Try to find a matched voice for accenting
      const matched = voices.find(v => v.lang.startsWith(utterance.lang.substring(0, 2)));
      if (matched) {
        utterance.voice = matched;
      }
    }

    utterance.onend = () => {
      setIsSpeaking(false);
      setTranscriptText("");
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setTranscriptText("");
    };

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setTranscriptText("");
  };

  const handleSelectTopic = (topicId: string) => {
    stopSpeaking();
    setSelectedTopic(topicId);
  };

  const handleLangToggle = (lang: AppLanguage) => {
    stopSpeaking();
    setOverrideLang(lang);
    if (onLanguageChange) {
      onLanguageChange(lang);
    }
  };

  return (
    <div className="relative" id="vocal-linguistic-assistant-hub">
      {/* Tiny Trigger Icon in Header bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-1.5 rounded-lg border text-[10px] font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
          isOpen 
            ? "bg-slate-900 text-white border-slate-900" 
            : isSpeaking
              ? "bg-emerald-600 border-emerald-500 text-white animate-pulse"
              : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
        }`}
        title="Guide Vocal National RDC"
      >
        <Headphones className={`w-3.5 h-3.5 ${isSpeaking ? "animate-bounce" : ""}`} />
        <span className="font-sans font-bold uppercase tracking-wider text-[8.5px]">
          {isSpeaking ? "🔊 Lecteur Actif" : "🗣️ Assistance Vocale"}
        </span>
      </button>

      {/* Floating Panel for Vocal Guidance */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 md:w-96 bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl z-50 text-left space-y-4"
          >
            {/* Header info */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-blue-50 text-blue-600 rounded-lg">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-[10.5px] font-black uppercase tracking-wider text-slate-800 font-sans">
                    Guide Vocal de Proximité
                  </h4>
                  <span className="text-[8.5px] font-mono text-slate-505 block">
                    Bilingue & 4 Langues Nationales de RDC
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { stopSpeaking(); setIsOpen(false); }}
                className="text-[9.5px] font-bold text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                Fermer
              </button>
            </div>

            {/* Language Selector Overrides inside voice block */}
            <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-2xl space-y-1.5">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-mono">
                Choisissez la langue de synthèse vocale :
              </span>
              <div className="grid grid-cols-3 gap-1">
                {(["fr", "en", "ln", "sw", "ts", "kk"] as AppLanguage[]).map((lang) => {
                  const labels: Record<AppLanguage, string> = {
                    fr: "Français",
                    en: "English",
                    ln: "Lingala",
                    sw: "Swahili",
                    ts: "Tshiluba",
                    kk: "Kikongo"
                  };
                  const isCur = overrideLang === lang;
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => handleLangToggle(lang)}
                      className={`py-1 px-1.5 rounded-lg border text-[8.5px] font-sans font-bold cursor-pointer transition-all text-center ${
                        isCur 
                          ? "bg-slate-900 text-white border-slate-900" 
                          : "bg-white text-slate-755 border-slate-201 hover:bg-slate-101"
                      }`}
                    >
                      {labels[lang]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Topic Select tab buttons */}
            <div className="space-y-1">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-mono">
                Sujets d'Écoute d'État :
              </span>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {vocalGuidesList.map((topic) => {
                  const isActive = selectedTopic === topic.id;
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => handleSelectTopic(topic.id)}
                      className={`px-2.5 py-1.5 rounded-xl border text-[9px] font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-all ${
                        isActive
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span>{topic.emoji}</span>
                      <span>{topic.title[overrideLang] ? topic.title[overrideLang].split(" ")[0] : topic.title["fr"].split(" ")[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Readout Active Board Card */}
            <div className="bg-[#050B14] text-slate-100 p-4 rounded-3xl border border-slate-800 space-y-3.5 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <span className="text-[8px] text-emerald-400 font-mono tracking-widest uppercase block">
                    {activeTopicObj.emoji} AUDITION CITOYENNE
                  </span>
                  <h5 className="text-[11px] font-extrabold text-white font-sans uppercase">
                    {activeTitle}
                  </h5>
                </div>

                {isSpeaking && (
                  <div className="flex items-center gap-0.5 h-3">
                    <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 bg-emerald-400 rounded-full" />
                    <motion.div animate={{ height: [8, 4, 8] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.1 }} className="w-0.5 bg-emerald-400 rounded-full" />
                    <motion.div animate={{ height: [12, 6, 12] }} transition={{ repeat: Infinity, duration: 0.7, delay: 0.2 }} className="w-0.5 bg-emerald-400 rounded-full" />
                    <motion.div animate={{ height: [6, 10, 6] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }} className="w-0.5 bg-emerald-400 rounded-full" />
                  </div>
                )}
              </div>

              <div className="text-[10px] text-slate-300 leading-relaxed font-sans font-medium text-left max-h-[100px] overflow-y-auto">
                {activeText}
              </div>

              {/* Speech Controls row */}
              <div className="flex items-center justify-between border-t border-slate-850 pt-2.5">
                <div className="flex items-center gap-1.5 font-sans">
                  <span className="text-[8px] text-slate-500 font-mono">Rythme :</span>
                  <select
                    value={playbackRate}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setPlaybackRate(val);
                      if (isSpeaking) {
                        // Restart with new rate
                        stopSpeaking();
                        setTimeout(() => handleSpeakGuide(), 100);
                      }
                    }}
                    className="bg-slate-900 text-slate-300 border border-slate-800 rounded px-1 py-0.5 text-[8.5px] outline-none cursor-pointer"
                  >
                    <option value="0.8">Lent (0.8x)</option>
                    <option value="1.0">Normal (1.0x)</option>
                    <option value="1.2">Rapide (1.2x)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleSpeakGuide}
                  className={`py-1.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all ${
                    isSpeaking 
                      ? "bg-red-600 hover:bg-red-700 text-white animate-pulse" 
                      : "bg-emerald-600 hover:bg-emerald-500 text-white"
                  }`}
                >
                  {isSpeaking ? (
                    <>
                      <Square className="w-3 h-3 text-white fill-white" />
                      <span>Arrêter</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 text-white fill-white" />
                      <span>Écouter Vocal</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Transcription Subtitle display */}
            {isSpeaking && transcriptText && (
              <div className="bg-[#121B2A] border border-blue-900/30 p-2 text-center rounded-xl animate-in fade-in duration-200">
                <span className="text-[7.5px] text-emerald-400 font-mono uppercase block font-bold mb-0.5 animate-pulse">Sous-titres en direct (Congolese Voice-over)</span>
                <p className="text-[9px] text-slate-100 font-sans italic leading-tight">
                  "{transcriptText}"
                </p>
              </div>
            )}

            {/* Footer stamp */}
            <div className="text-[8px] text-slate-400 flex items-center justify-between font-mono pt-1">
              <span>RÉSEAU GOMOTO ASSISTANCE</span>
              <span>RCD AP-3000-D</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
