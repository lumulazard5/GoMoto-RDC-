/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CloudRain, CloudLightning, Sun, Cloud, Thermometer, RefreshCw, AlertTriangle, CloudFog, Wifi, WifiOff, X, Volume2, VolumeX } from "lucide-react";
import { DRCAddress } from "../types";
import { AppLanguage } from "../lib/translations";

interface WeatherCondition {
  id: string;
  icon: React.ReactNode;
  title: string;
  temperature: string;
  commune: string;
  alertText: string;
  recommendation: string;
  severity: "high" | "medium" | "low";
  colorClass: string;
  precipitation?: number;
}

const weatherSpeechTranslations: Record<AppLanguage, (alert: WeatherCondition) => { title: string; text: string; rec: string }> = {
  fr: (a) => ({
    title: a.title,
    text: a.alertText,
    rec: a.recommendation
  }),
  en: (a) => {
    let t = a.title;
    let txt = a.alertText;
    let r = a.recommendation;
    if (a.title.includes("Pluies Intermittentes") || a.title.includes("Rain")) {
      t = "Intermittent Rain Alert";
      txt = "Road potentially wet. Increased risk of traffic jams.";
      r = "Bikers: Reduce your speed! Always offer a clean helmet with a visor to your passenger.";
    } else if (a.title.includes("Ensoleillement") || a.title.includes("Sun")) {
      t = "Strong Equatorial Sunshine";
      txt = "High heat on the roads. Increased risk of fatigue.";
      r = "Hydrate regularly and plan regular engine cooling breaks for the motorcycle.";
    } else if (a.title.includes("Chaleur Tropicale")) {
      t = "Tropical Heatwave";
      txt = `High heat of ${a.temperature}. Suffocating heat on the Congolese asphalt.`;
      r = "Wear dust glasses, drink purified water regularly, and watch out for engine overheating.";
    } else if (a.title.includes("Clair & Sec") || a.title.includes("Clear")) {
      t = "Clear & Dry Sky";
      txt = `Excellent thermal driving conditions at ${a.temperature}.`;
      r = "Ideal traffic conditions. Constantly demand helmets for both biker and client.";
    } else if (a.title.includes("Nuageux") || a.title.includes("Cloudy")) {
      t = "Cloudy / Variable";
      txt = "Overcast sky without main precipitation threat.";
      r = "Ride with peace of mind. Keep an eye on mirrors to anticipate overtaking.";
    } else if (a.title.includes("Brouillard") || a.title.includes("Fog")) {
      t = "Fog or Reduced Visibilty";
      txt = "Morning fog or suspended dust limiting the visual field.";
      r = "Turn on your signaling lights and strictly follow local road markings.";
    } else if (a.title.includes("Bruine")) {
      t = "Light Drizzle";
      txt = "Light moisture creating a slippery film on asphalt and soil.";
      r = "Weakened grip! Reduce your average speed and avoid steep turns.";
    } else if (a.title.includes("Active en Cours")) {
      t = "Active Rain Falling";
      txt = "Dense precipitation, risk of water accumulation.";
      r = "Adapt speed on flooded roads. Keep helmet visor down and increase braking distances.";
    } else if (a.title.includes("diluviennes")) {
      t = "Downpour / Torrential Rain";
      txt = "Immediate heavy rainfall leading to temporary flooding.";
      r = "CRITICAL: Seek shelter! Do not attempt crossing deep water puddles.";
    } else if (a.title.includes("Orage Violent")) {
      t = "Severe Thunderstorm & Lightning";
      txt = "Strong electrical disturbances with heavy wind gusts.";
      r = "Park the motorcycle in a sheltered, stable place. Avoid operating near open drains.";
    } else {
      t = "Clear Weather Warning";
      txt = "Normal conditions with no major weather warning active.";
      r = "Take care of your passengers. Drive with the highest professional civic duty.";
    }
    return { title: t, text: txt, rec: r };
  },
  sw: (a) => {
    let t = "Tahadhari ya Hali ya Hewa";
    let txt = "Hali ya hewa ya kawaida.";
    let r = "Endesha kwa usalama.";
    if (a.title.includes("Pluies Intermittentes") || a.title.includes("Rain")) {
      t = "Tahadhari ya Mvua za hapa na pale";
      txt = "Barabara inaweza kuwa na unyevu. Hatari kubwa ya msongamano.";
      r = "Waendesha pikipiki: Punguza kasi! Toa kofia safi yenye kingao cha macho kwa abiria.";
    } else if (a.title.includes("Ensoleillement") || a.title.includes("Sun")) {
      t = "Mwanga mkali wa Jua";
      txt = "Joto kali barabarani. Hatari kubwa ya uchovu.";
      r = "Kunywa maji mara kwa mara na upange mapumziko ya kupoza injini ya pikipiki.";
    } else if (a.title.includes("Chaleur Tropicale")) {
      t = "Wimbi la Joto la Tropiki";
      txt = `Joto kali la ${a.temperature}. Joto linalokera kwenye lami ya Kongo.`;
      r = "Vaa miwani ya kuzuia vumbi, kunywa maji safi na uangalie pikipiki isipate joto kupita kiasi.";
    } else if (a.title.includes("Clair & Sec") || a.title.includes("Clear")) {
      t = "Anga Safi na Kavu";
      txt = `Hali nzuri ya kuendesha pikipiki kwenye joto la ${a.temperature}.`;
      r = "Hali nzuri ya trafiki. Hakikisha wewe na mteja mmevaa kofia ngumu kila wakati.";
    } else if (a.title.includes("Nuageux") || a.title.includes("Cloudy")) {
      t = "Mawingu / Hali ya kubadilika";
      txt = "Anga imefunikwa na mawingu bila hatari ya mvua kubwa.";
      r = "Endesha kwa amani. Angalia vioo vya nyuma ili kujiandaa kwa magari yanayopishana.";
    } else if (a.title.includes("Brouillard") || a.title.includes("Fog")) {
      t = "Ukungu au Kutoona vizuri";
      txt = "Ukungu wa asubuhi au vumbi vinavyopunguza uwezo wa kuona.";
      r = "Washa taa za usalama na ufuate kwa makini alama za barabarani.";
    } else if (a.title.includes("Bruine")) {
      t = "Mvua ndogo ya manyunyu";
      txt = "Unyevu mdogo unaofanya barabara kuteleza.";
      r = "Ushikaji wa tairi umepungua! Punguza kasi na uepuke kona kali.";
    } else if (a.title.includes("Active en Cours")) {
      t = "Mvua Kubwa Inanyesha";
      txt = "Mvua kubwa, hatari ya barabara kujaa maji.";
      r = "Badilisha kasi kwenye barabara zilizojaa maji. Funga kofia na uongeze nafasi ya kusimama.";
    } else if (a.title.includes("diluviennes")) {
      t = "Mvua kubwa ya gharika";
      txt = "Mvua kubwa inayoweza kusababisha mafuriko ya muda.";
      r = "HATARI: Tafuta mahali pa kujificha! Usijaribu kuvuka madimbwi marefu ya maji.";
    } else if (a.title.includes("Orage Violent")) {
      t = "Radi na Umeme mkali";
      txt = "Usumbufu mkubwa wa umeme na upepo mkali.";
      r = "Egesha pikipiki mahali palipo salama na pa usalama. Epuka kuendesha karibu na mifereji ya wazi.";
    } else {
      t = "Hali ya Hewa ya Kawaida";
      txt = "Hali ya kawaida bila tahadhari yoyote kubwa ya hewa.";
      r = "Tunza abiria wako. Endesha kwa uzoefu wa hali ya juu na uraia mwema.";
    }
    return { title: t, text: txt, rec: r };
  },
  ln: (a) => {
    let t = "Kebola ya Mopepe na Mbula";
    let txt = "Ezali malamu.";
    let r = "Kumba malembe mpe na mayele.";
    if (a.title.includes("Pluies Intermittentes") || a.title.includes("Rain")) {
      t = "Kebola ya Mbula ya moke moke";
      txt = "Nzela ekoki kozala na mai. Likama ya nkokoso ya motuka.";
      r = "Bamotari: Kitisa lofango! Pesá ekoti ya molonge oyo ekoki mpe ezali na kiti mpo na mofuti.";
    } else if (a.title.includes("Ensoleillement") || a.title.includes("Sun")) {
      t = "Moi makasi mpenza";
      txt = "Moi ya moto na batshini. Likama ya bolembo.";
      r = "Melaka mai mbala na mbala mpe pemisa moter ya motari mpo ekita moto.";
    } else if (a.title.includes("Chaleur Tropicale")) {
      t = "Molunge makasi ya Mikili ya Moto";
      txt = `Molunge monene ya ${a.temperature}. Molunge mabe na nzela ya lami.`;
      r = "Latá talatala ya pupu, melá mai ya pɛto mpe ekatela moter mpo epela te.";
    } else if (a.title.includes("Clair & Sec") || a.title.includes("Clear")) {
      t = "Likolo ya Pɛto mpe na Elanga";
      txt = `Nzela ezali malamu mpenza mpo na kokumba na molunge ${a.temperature}.`;
      r = "Nzela ezali kitoko. Latisa moto na moto ekoti ya motari tango nyonso.";
    } else if (a.title.includes("Nuageux") || a.title.includes("Cloudy")) {
      t = "Likolo ezipami na Mapata";
      txt = "Mapata ezipi likolo kasi mbula makasi te.";
      r = "Kumba na kimia. Talaka talatala ya sima mpo na mayele na babateli basusu.";
    } else if (a.title.includes("Brouillard") || a.title.includes("Fog")) {
      t = "Londende mpe Kozanga komona malamu";
      txt = "Londende ya tongo tongo to mputulu ekoki kopekisa komona malamu.";
      r = "Pelisa miinda ya kikebisa mpe limbola malako nyonso ya nzela.";
    } else if (a.title.includes("Bruine")) {
      t = "Mbula ya nsetse to matanga moke";
      txt = "Mai ya mbula ya moke oyo esalaka ete balami na mabele esielika.";
      r = "Nzela esieliki! Kitisa lofango mpe kumba bapene ya mbalakaka te.";
    } else if (a.title.includes("Active en Cours")) {
      t = "Mbula ya makasi ezali konoka";
      txt = "Mbula makasi na rdc. Likama ya tonki ya mai.";
      r = "Kumba malembe na bitando oyo ezali na mai. Zipa ekoti mpe batela ntaka tii na kotelema.";
    } else if (a.title.includes("diluviennes")) {
      t = "Averse makasi ya kobebisa";
      txt = "Mbula ya kobungisa ebomi nzela mpe ekoki kobimisa mai na baboka.";
      r = "KEBA: Luká esika ya kobatama! Kokatisa mai ya mozindo oyo eyebani te te.";
    } else if (a.title.includes("Orage Violent")) {
      t = "Nkake ya makasi na Likolo";
      txt = "Nkake mpe mopepe makasi ya kopekisa botamboli.";
      r = "Telemisa motari na mopepe mpe na esika ya malamu. Kopusana pembeni ya simangola te.";
    } else {
      t = "Hali ya Hewa malamu";
      txt = "Makambo ezali malamu, mbula ya kobeba ezali te.";
      r = "Batela mofuti na yo malamu. Kumba lokola motari ya mayele mpe ya bwanya.";
    }
    return { title: t, text: txt, rec: r };
  },
  ts: (a) => {
    let t = "Diyanyisha dya tshitupa dya mulu";
    let txt = "Malu onso adi bimpe.";
    let r = "Kwendayi bimpe na budimu.";
    if (a.title.includes("Intermittentes") || a.title.includes("Rain")) {
      t = "Kebula dya mvula dya moke-moke";
      txt = "Nshila udi ne nshishe. Ditayika dya mâyi pa lami.";
      r = "Bamotard: Kipeleka lubilu! Pa tshifulu tshia tshitendele tikezuke kudi muendi.";
    } else if (a.title.includes("Ensoleillement") || a.title.includes("Sun")) {
      t = "Diba dya bukole dya equatorial";
      txt = "Diba dya luya kulu pa nshila. Ditayika dya bulembo ne mutupu.";
      r = "Nuwela mâyi ekese mbala na mbala, ne upumisha mashinyi bua luya lwikale lunkila.";
    } else if (a.title.includes("Chaleur Tropicale")) {
      t = "Luya lunene dya Tropique";
      txt = `Luya lunene lua ${a.temperature} pa lami dya Kinshasa.`;
      r = "Lata lupapu lua dîsu, nuwela mâyi a pɛto, ne utuma dîsu ku luya lua moter bua kayipeli.";
    } else if (a.title.includes("Clair & Sec") || a.title.includes("Clear")) {
      t = "Mulu mutoke kabuyi mapata";
      txt = `Ntambi ya bimpe ya kwendela na motobo mu luya lua ${a.temperature}.`;
      r = "Nshila udi mutoke. Lata tshifulu dya motobo kudi muendesi ne muendi tshienu tshionso.";
    } else if (a.title.includes("Nuageux") || a.title.includes("Cloudy")) {
      t = "Mulu mubuikila kudi mapata";
      txt = "Mapata adi a bungi mulu kakuyi mvula.";
      r = "Kwendayi na ditalala. Tangila lumuenu lua nyima bua kudimuka bamotari basusu.";
    } else if (a.title.includes("Brouillard") || a.title.includes("Fog")) {
      t = "Mupupu ne diko dia munda";
      txt = "Mupupu dya dinda katuena tumona kumpala mpenza.";
      r = "Tema minda ya ditalala ne ulonde bimpe bileji bidi pa nshila dya leta.";
    } else if (a.title.includes("Bruine")) {
      t = "Mvula ya mikanga mikanga";
      txt = "Mâyi ekese a mvula adi ashelesha nshila wa lami.";
      r = "Lubilu lukele! Kipula mukanu wa lubilu kumpala kua kukatuka nshila.";
    } else if (a.title.includes("Active en Cours")) {
      t = "Mvula ya bukole idi iloka";
      txt = "Mvula ya bukole idi ne mâyi a bungi pa nshila dya Kinshasa.";
      r = "Fikita lubilu lua nshila. Kanga tshitshibidi tshia tshifulu ne kuakaja lupapu.";
    } else if (a.title.includes("diluviennes")) {
      t = "Mvula ya kabutu kapitshile";
      txt = "Mvula mukole udi utayisha mâyi a bungi ne nshila unyangeka.";
      r = "MUKWASHU: Keba muaba wa kusombela mfranga! Kudikadidi kuela mâyi mu nshila unudi kamuyi bamanye nzola.";
    } else if (a.title.includes("Orage Violent")) {
      t = "Nshishe ne bikube ne bikubakuba kulu";
      txt = "Mvula wa mpepele ne bikube ne lumuenu lukole.";
      r = "Telemisha mutobo mu muaba mupumuke, kudi kakuyi bikube bia kapia.";
    } else {
      t = "Kadi dya mulu dya bimpe";
      txt = "Kadi kakuena dibungama dia malu a mvula nansha.";
      r = "Lama bena mashinyi ne bena moto bimpe. Kwendayi ne budimu bua mpatshi.";
    }
    return { title: t, text: txt, rec: r };
  },
  kk: (a) => {
    let t = "Mayele ya kiyambula";
    let txt = "Hali ya mbote.";
    let r = "Diata na kikesa mpe mayele.";
    if (a.title.includes("Intermittentes") || a.title.includes("Rain")) {
      t = "Mayanga ya mvula ya fioti-fioti";
      txt = "Nzila lenda vanda ti maza. Likama ya basikalalu mpe bampangi.";
      r = "Bayari ya moto: Kitula makasi! Pesa kipu ya mpembe mpe ya mbote na nzenza.";
    } else if (a.title.includes("Ensoleillement") || a.title.includes("Sun")) {
      t = "Ntangu ya ngolo ya kiyambula";
      txt = "Ntangu ya ngolo mpenza na nzila. Mbote na kuvuanda ti kikesa.";
      r = "Nua maza mbala na mbala mpe pemisa moto mpo na kukitula tiya ya moter.";
    } else if (a.title.includes("Chaleur Tropicale")) {
      t = "Tiya ya katuka Tropiques";
      txt = `Tiya ya ngolo mpenza ya ${a.temperature} na lami ya buala.`;
      r = "Lata luneti ya mpupu mpe vumbi, nua maza ya mbote, mpe keba mpo na tiya ya moter.";
    } else if (a.title.includes("Clair & Sec") || a.title.includes("Clear")) {
      t = "Zulu ya mpembe mpe ya kukonda mapata";
      txt = `Hali ya mbote mpo na kutambula tiya ya fioti ya ${a.temperature}.`;
      r = "Nzila ya mbote kibeni. Lata nkokoso mvuama mpo na nge mpe na mupesi-course.";
    } else if (a.title.includes("Nuageux") || a.title.includes("Cloudy")) {
      t = "Mapata ya nene na zulu de Kongo";
      txt = "Zulu kele ya kukonda kukenga, kasi mvula ya ngolo kele ve.";
      r = "Tambula na luvuvamu. Tala kitalatala ya nima mpo na kukeba bamotari yankaka.";
    } else if (a.title.includes("Brouillard") || a.title.includes("Fog")) {
      t = "Londende ya tongo mpe yuma";
      txt = "Londende ya ntonge-tonge tula mpasi na meso mpo na kumona kinvuka.";
      r = "Pelisa miinda ya kikebisa mpe lembo kibeni bansangu nyonso ya nzila.";
    } else if (a.title.includes("Bruine")) {
      t = "Mvula ya fioti-fioti ke noka";
      txt = "Maza ya fioti ke dunda nzila mpe lami ke kulu-kulu.";
      r = "Kukitula kikesa ya nzila! Lembo kudiata lami mpe buya ti bitampi basimbikila.";
    } else if (a.title.includes("Active en Cours")) {
      t = "Mvula ya katuka mbote ke noka";
      txt = "Mvula mingi, likama ya maza na nzila ya lami.";
      r = "Kukitula ntinu ya diata na nzila. Kanga lupapu ya kitalatala mpe buya bamotari.";
    } else if (a.title.includes("diluviennes")) {
      t = "Mvula ya ngolo ya kiyambula";
      txt = "Mvula ya kiyambula ngolo, imene kudinga nzila mpe maboko maza ya luvunu.";
      r = "MUKWASHU: Sosa kisika ya kukandama! Kusosa kueluka maza ya ndala yina nge zaba ve na nzila.";
    } else if (a.title.includes("Orage Violent")) {
      t = "Nkele ti banzazi mpe mipepe na zulu";
      txt = "Mipepe ya kaka mpe banzazi ya kikebisa bansangu.";
      r = "Telama pikipiki na kisika ya mbote mpe ya ngolo. Buya kutambula pene ya maza.";
    } else {
      t = "Kiyambula ya mbote";
      txt = "Mambu kele mbote, mvula ya ngolo kele ve.";
      r = "Kebba muntu ya nsona. Diata kibeni ti mayele ya nene.";
    }
    return { title: t, text: txt, rec: r };
  }
};

// Localized risk mapping for DRC communes and cities to determine flood susceptibility
function isLocationFloodProne(locationName: string): boolean {
  if (!locationName) return false;
  const normalized = locationName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Traditional flood zones in Kinshasa and other parts of DRC (e.g. Limete, Kalamu near Mososo, Barumbu stream outflows)
  const highRiskAreas = ["limete", "kalamu", "barumbu", "lingwala", "n'djili", "ndjili", "masina", "gombe", "ngaliema", "boma", "kisangani", "uvira", "funa", "mososo", "mombele", "bandalungwa"];
  return highRiskAreas.some(area => normalized.includes(area));
}

// Highly detailed DRC coordinates repository for precision geo-targeting
const drcCoordinatesList: Record<string, { lat: number; lon: number; cityLabel: string }> = {
  "kinshasa": { lat: -4.325, lon: 15.322, cityLabel: "Kinshasa" },
  "lubumbashi": { lat: -11.6607, lon: 27.4794, cityLabel: "Lubumbashi" },
  "likasi": { lat: -10.9855, lon: 26.7303, cityLabel: "Likasi" },
  "kasumbalesa": { lat: -12.2530, lon: 27.7950, cityLabel: "Kasumbalesa" },
  "kolwezi": { lat: -10.7167, lon: 25.4667, cityLabel: "Kolwezi" },
  "bukavu": { lat: -2.5083, lon: 28.8612, cityLabel: "Bukavu" },
  "uvira": { lat: -3.3953, lon: 29.1372, cityLabel: "Uvira" },
  "baraka": { lat: -4.0950, lon: 29.0858, cityLabel: "Baraka" },
  "goma": { lat: -1.6792, lon: 29.2228, cityLabel: "Goma" },
  "butembo": { lat: 0.1500, lon: 29.2833, cityLabel: "Butembo" },
  "beni": { lat: 0.4914, lon: 29.4731, cityLabel: "Beni" },
  "kisangani": { lat: 0.5156, lon: 25.1900, cityLabel: "Kisangani" },
  "kananga": { lat: -5.8958, lon: 22.4178, cityLabel: "Kananga" },
  "mbuji-mayi": { lat: -6.1333, lon: 23.6000, cityLabel: "Mbuji-Mayi" },
  "matadi": { lat: -5.8167, lon: 13.4500, cityLabel: "Matadi" },
  "boma": { lat: -5.8500, lon: 13.0500, cityLabel: "Boma" },
  "muanda": { lat: -5.9333, lon: 12.3500, cityLabel: "Muanda" },
  "mbanza-ngungu": { lat: -5.2500, lon: 14.8667, cityLabel: "Mbanza-Ngungu" },
  "kikwit": { lat: -5.0410, lon: 18.8160, cityLabel: "Kikwit" },
  "bandundu": { lat: -3.3167, lon: 17.3667, cityLabel: "Bandundu" },
  "kenge": { lat: -4.8333, lon: 16.9667, cityLabel: "Kenge" },
  "inongo": { lat: -1.9500, lon: 18.2667, cityLabel: "Inongo" },
  "bunia": { lat: 1.5620, lon: 30.2483, cityLabel: "Bunia" },
  "isiro": { lat: 2.7600, lon: 27.6160, cityLabel: "Isiro" },
  "buta": { lat: 2.7931, lon: 24.7300, cityLabel: "Buta" },
  "gbadolite": { lat: 4.2833, lon: 21.0167, cityLabel: "Gbadolite" },
  "gemena": { lat: 3.2500, lon: 19.7667, cityLabel: "Gemena" },
  "lisala": { lat: 2.1500, lon: 21.5167, cityLabel: "Lisala" },
  "mbandaka": { lat: 0.0487, lon: 18.2562, cityLabel: "Mbandaka" },
  "boende": { lat: -0.2200, lon: 20.8800, cityLabel: "Boende" },
  "tshikapa": { lat: -6.4161, lon: 20.7997, cityLabel: "Tshikapa" },
  "kabinda": { lat: -6.1333, lon: 24.4833, cityLabel: "Kabinda" },
  "lusambo": { lat: -4.9750, lon: 23.4417, cityLabel: "Lusambo" },
  "kindu": { lat: -2.9500, lon: 25.9167, cityLabel: "Kindu" },
  "kamina": { lat: -8.7386, lon: 24.9906, cityLabel: "Kamina" },
  "kalemie": { lat: -5.9475, lon: 29.1947, cityLabel: "Kalemie" }
};

// Robust static fallback pool for instant offline operations
const staticWeatherBackup: WeatherCondition[] = [
  {
    id: "rain-1",
    icon: <CloudRain className="w-5 h-5 text-sky-450 animate-bounce" />,
    title: "Alerte Pluies Intermittentes",
    temperature: "26°C",
    commune: "Kinshasa",
    alertText: "Chaussée potentiellement humide. Risques d'embouteillages accrus.",
    recommendation: "Motards : Modérez votre vitesse ! Offrez impérativement un casque passager propre avec visière.",
    severity: "medium",
    colorClass: "from-sky-950/40 to-slate-900 border-sky-500/30 text-sky-200",
    precipitation: 14.5
  },
  {
    id: "heat-1",
    icon: <Sun className="w-5 h-5 text-amber-500 animate-[spin_15s_linear_infinite]" />,
    title: "Fort Ensoleillement Équatorial",
    temperature: "32°C",
    commune: "Gombe",
    alertText: "Chaleur élevée sur les routes. Risque accru de fatigue.",
    recommendation: "Hydratez-vous régulièrement et prévoyez des pauses d'aération moteur régulières pour la moto.",
    severity: "low",
    colorClass: "from-amber-950/30 to-slate-900 border-amber-500/30 text-amber-200",
    precipitation: 0.0
  }
];

// Resolves geographical variables to exact coordinates
function resolveLocationCoordinates(address?: DRCAddress): { lat: number; lon: number; locationName: string } {
  if (!address) {
    return { lat: -4.325, lon: 15.322, locationName: "Kinshasa, RDC" };
  }

  const cityLower = (address.city || "").toLowerCase().trim();
  const provinceLower = (address.province || "").toLowerCase().trim();

  // Primary match by City
  if (cityLower && drcCoordinatesList[cityLower]) {
    const data = drcCoordinatesList[cityLower];
    return {
      lat: data.lat,
      lon: data.lon,
      locationName: address.commune ? `${address.commune}, ${data.cityLabel}` : data.cityLabel
    };
  }

  // Backup match by Province
  if (provinceLower && drcCoordinatesList[provinceLower]) {
    const data = drcCoordinatesList[provinceLower];
    return {
      lat: data.lat,
      lon: data.lon,
      locationName: address.commune ? `${address.commune}, ${data.cityLabel}` : data.cityLabel
    };
  }

  // Soft fuzzy check
  for (const [key, cords] of Object.entries(drcCoordinatesList)) {
    if (cityLower.includes(key) || key.includes(cityLower)) {
      return {
        lat: cords.lat,
        lon: cords.lon,
        locationName: address.commune ? `${address.commune}, ${cords.cityLabel}` : cords.cityLabel
      };
    }
  }

  // Defaults to capital Kinshasa
  return {
    lat: -4.325,
    lon: 15.322,
    locationName: address.commune ? `${address.commune}, Kinshasa` : "Kinshasa, RDC"
  };
}

// Maps WMO codes to aesthetic alert categories with instructions tailored to moto transport
function mapWmoToTheme(code: number, temp: number): {
  icon: React.ReactNode;
  title: string;
  alertText: string;
  recommendation: string;
  severity: "high" | "medium" | "low";
  colorClass: string;
} {
  // Extreme hot weather condition guard
  if (temp >= 33) {
    return {
      icon: <Sun className="w-5 h-5 text-yellow-500 animate-[spin_10s_linear_infinite]" />,
      title: "Vague de Chaleur Tropicale",
      alertText: `Température de ${temp}°C. Chaleur étouffante sur l'asphalte congolais.`,
      recommendation: "Portez des lunettes anti-poussière, buvez de l'eau purifiée régulièrement et veillez aux surchauffes moteur.",
      severity: "medium",
      colorClass: "from-amber-950/40 to-slate-900 border-amber-500/25 text-amber-200"
    };
  }

  switch (code) {
    case 0: // Clear
      return {
        icon: <Sun className="w-5 h-5 text-amber-400" />,
        title: "Ciel Clair & Sec",
        alertText: `Excellentes conditions de conduite thermale à ${temp}°C.`,
        recommendation: "Conditions de circulation idéales. Exigez constamment le port des casques motard et client.",
        severity: "low",
        colorClass: "from-sky-950/20 to-slate-900 border-sky-500/20 text-sky-200"
      };

    case 1:
    case 2:
    case 3: // Cloudy variants
      return {
        icon: <Cloud className="w-5 h-5 text-slate-300" />,
        title: "Nuageux / Variable",
        alertText: "Ciel couvert d'altitude sans menace de précipitations majeures.",
        recommendation: "Roulez en toute sérénité. Gardez un œil sur les rétroviseurs pour anticiper les dépassements.",
        severity: "low",
        colorClass: "from-slate-800/30 to-slate-900 border-slate-700/30 text-slate-300"
      };

    case 45:
    case 48: // Foggy
      return {
        icon: <CloudFog className="w-5 h-5 text-indigo-400 animate-pulse" />,
        title: "Brouillard ou Visibilité Réduite",
        alertText: "Brouillard matinal ou suspension de poussière limitant le champ visuel.",
        recommendation: "Allumez vos feux de signalisation et respectez strictement le marquage au sol municipal.",
        severity: "medium",
        colorClass: "from-indigo-950/35 to-slate-900 border-indigo-500/25 text-indigo-200"
      };

    case 51:
    case 53:
    case 55: // Drizzle
      return {
        icon: <CloudRain className="w-5 h-5 text-sky-400" />,
        title: "Bruine légère / Crachin",
        alertText: "Légère humidité créant un film glissant sur le bitume et la terre.",
        recommendation: "Adhérence affaiblie ! Réduisez votre vitesse moyenne et évitez les prises d'angles prononcées.",
        severity: "medium",
        colorClass: "from-sky-950/30 to-slate-900 border-sky-500/20 text-sky-200"
      };

    case 61:
    case 63: // Moderate Rain
      return {
        icon: <CloudRain className="w-5 h-5 text-sky-500 animate-bounce" />,
        title: "Pluie Active en Cours",
        alertText: "Précipitations denses à Kinshasa. Risques d'accumulation d'eau.",
        recommendation: "Adaptez l'allure sur chaussées inondées. Activez la visière du casque et rallongez les distances de freinage.",
        severity: "high",
        colorClass: "from-sky-950/40 to-slate-900 border-sky-500/35 text-sky-150"
      };

    case 65:
    case 80:
    case 81:
    case 82: // Intense showers
      return {
        icon: <CloudRain className="w-5 h-5 text-blue-500 animate-pulse" />,
        title: "Averses diluviennes / Torrentielles",
        alertText: "Torrent pluvial immédiat menant à des inondations communales temporaires.",
        recommendation: "CRITIQUE : Mettez-vous à l'abri ! Ne tentez aucun franchissement de flaques profondes non identifiées.",
        severity: "high",
        colorClass: "from-blue-950/40 to-slate-900 border-blue-500/40 text-blue-200"
      };

    case 95:
    case 96:
    case 99: // Thunderstorm
      return {
        icon: <CloudLightning className="w-5 h-5 text-yellow-405 animate-pulse" />,
        title: "Orage Violent & Éclairs",
        alertText: "Fortes perturbations électriques avec rafales de vents violents.",
        recommendation: "Garez la moto dans un lieu abrité et stable. Éviter d'opérer près des caniveaux à ciel ouvert.",
        severity: "high",
        colorClass: "from-red-950/45 to-slate-900 border-red-500/35 text-red-200"
      };

    default:
      return {
        icon: <Cloud className="w-5 h-5 text-zinc-400" />,
        title: "Climat Stable",
        alertText: "Conditions normales sans alerte météo majeure active.",
        recommendation: "Prenez soins de vos passagers. Conduisez avec le plus grand professionnalisme citoyen.",
        severity: "low",
        colorClass: "from-slate-800/25 to-slate-900 border-slate-700/20 text-slate-350"
      };
  }
}

interface WeatherAlertProps {
  theme?: "light" | "dark";
  communeFilter?: string;
  address?: DRCAddress;
  lang?: AppLanguage;
}

export default function WeatherAlert({ theme = "dark", communeFilter, address, lang = "fr" }: WeatherAlertProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [isFetched, setIsFetched] = useState<boolean>(false);
  const [errorState, setErrorState] = useState<boolean>(false);
  const [weatherCondition, setWeatherCondition] = useState<WeatherCondition | null>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [debugData, setDebugData] = useState<{
    lat: number;
    lon: number;
    source: string;
    targetUrl: string;
    resolvedName: string;
    precipitation?: number;
  } | null>(null);

  // Stop any ongoing speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const fetchRealTimeWeather = async () => {
    setLoading(true);
    setErrorState(false);

    const cords = resolveLocationCoordinates(address);
    const apiQueryUrl = `https://api.open-meteo.com/v1/forecast?latitude=${cords.lat}&longitude=${cords.lon}&current_weather=true&daily=precipitation_sum&timezone=auto`;
    
    // Determine the source matching type
    let matchingSource = "Coordonnées de repli (Kinshasa)";
    if (address?.city && drcCoordinatesList[address.city.toLowerCase().trim()]) {
      matchingSource = `Base de données Ville : Match exact d'arrondissement [${address.city}]`;
    } else if (address?.province && drcCoordinatesList[address.province.toLowerCase().trim()]) {
      matchingSource = `Base de données Province : Match départemental [${address.province}]`;
    } else if (address) {
      matchingSource = `Défaut : Kinshasa (recherche infructueuse pour "${address.city || ""}")`;
    }

    setDebugData({
      lat: cords.lat,
      lon: cords.lon,
      source: matchingSource,
      targetUrl: apiQueryUrl,
      resolvedName: cords.locationName,
      precipitation: undefined
    });

    try {
      // Access free public API Open-Meteo without the need for authentication keys
      const res = await fetch(apiQueryUrl);

      if (!res.ok) {
        throw new Error("HTTP connection failed");
      }

      const payload = await res.json();
      const currentVal = payload.current_weather;

      if (!currentVal) {
        throw new Error("Invalid payload format");
      }

      const tempInt = Math.round(currentVal.temperature);
      const wmoCode = currentVal.weathercode;

      let rainSum = 0;
      if (payload.daily && payload.daily.precipitation_sum && payload.daily.precipitation_sum.length > 0) {
        rainSum = payload.daily.precipitation_sum[0] ?? 0;
      } else {
        // Approximate precipitation based on WMO code if daily block missing
        if ([61, 63, 65, 80, 81, 82, 95, 96, 99].includes(wmoCode)) {
          rainSum = wmoCode >= 95 ? 18.2 : (wmoCode >= 65 ? 12.4 : 5.8);
        }
      }

      const aestheticProps = mapWmoToTheme(wmoCode, tempInt);

      setWeatherCondition({
        id: `api-${wmoCode}-${tempInt}`,
        icon: aestheticProps.icon,
        title: aestheticProps.title,
        temperature: `${tempInt}°C`,
        commune: cords.locationName,
        alertText: aestheticProps.alertText,
        recommendation: aestheticProps.recommendation,
        severity: aestheticProps.severity,
        colorClass: aestheticProps.colorClass,
        precipitation: rainSum
      });
      setDebugData(prev => prev ? { ...prev, precipitation: rainSum } : null);
      setIsFetched(true);
    } catch (error) {
      console.warn("Weather API fetch error, applying localized backup dataset:", error);
      setErrorState(true);

      // Gracefully resort to localized backup datasets so the view never breaks
      const randomIdx = Math.floor(Math.random() * staticWeatherBackup.length);
      const chosenBackup = staticWeatherBackup[randomIdx];

      setWeatherCondition({
        ...chosenBackup,
        commune: address?.commune ? `${address.commune}, ${address.city}` : chosenBackup.commune
      });
    } finally {
      // Small simulated delay to experience the smooth spinner state transitions properly
      setTimeout(() => {
        setLoading(false);
      }, 350);
    }
  };

  // Triggers updates whenever address variables are altered
  useEffect(() => {
    fetchRealTimeWeather();
  }, [address?.commune, address?.city, address?.province]);

  if (loading && !weatherCondition) {
    return (
      <div 
        className={`p-4 rounded-2xl border flex items-center justify-center gap-3 animate-pulse ${
          theme === "light" ? "bg-slate-50 border-slate-200 text-slate-500" : "bg-slate-950/50 border-slate-850 text-slate-400"
        }`}
      >
        <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
        <span className="text-[10px] font-black uppercase tracking-wider font-mono">
          Connexion au serveur météo RDC...
        </span>
      </div>
    );
  }

  const activeObj = weatherCondition || staticWeatherBackup[0];

  const handleSpeak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      console.warn("Speech synthesis not supported by this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Prepare speech alert text in the target language
    const langKey = lang || "fr";
    const resolver = weatherSpeechTranslations[langKey] || weatherSpeechTranslations["fr"];
    const textData = resolver(activeObj);
    const textToSpeak = `${textData.title}. ${textData.text}. ${textData.rec}`;

    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    // Set appropriate language specifier tag
    const langCodes: Record<AppLanguage, string> = {
      fr: "fr-FR",
      en: "en-US",
      sw: "sw-KE",
      ln: "fr-CD",
      ts: "fr-CD",
      kk: "fr-CD"
    };
    
    utterance.lang = langCodes[langKey] || "fr-FR";

    // Grab matching voice
    if (window.speechSynthesis.getVoices) {
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(v => v.lang.startsWith(utterance.lang.substring(0, 2)));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    }

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const isFloodProneArea = isLocationFloodProne(activeObj.commune);
  const localizedThreshold = isFloodProneArea ? 5.0 : 10.0;
  const currentRainSum = activeObj.precipitation ?? 0;
  const isFloodAlarmActive = currentRainSum >= localizedThreshold;

  const severityConfigs = {
    high: { text: "CRITIQUE", bg: "bg-red-500/10 text-red-400 border-red-500/30" },
    medium: { text: "PRUDENCE", bg: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
    low: { text: "STABLE", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" }
  };

  const currentBadge = severityConfigs[activeObj.severity];

  const containerStyleClass = theme === "light"
    ? "bg-slate-50 border border-slate-250 p-4 rounded-3xl flex flex-col gap-2.5 shadow-xs overflow-hidden text-left font-sans" 
    : "bg-slate-950/70 border border-slate-850 p-4 rounded-3xl flex flex-col gap-2.5 shadow-md overflow-hidden text-left font-sans";

  const isRain = activeObj.id.includes("rain") || activeObj.id.includes("61") || activeObj.id.includes("63") || activeObj.id.includes("65") || activeObj.id.includes("80");
  const isHeat = activeObj.id.includes("heat") || activeObj.id.includes("sun") || activeObj.id.includes("clear");
  const isStorm = activeObj.id.includes("storm") || activeObj.id.includes("95") || activeObj.id.includes("96") || activeObj.id.includes("99");

  const bannerColorClass = theme === "light"
    ? `bg-linear-to-r ${isRain ? "from-sky-100 to-white text-sky-900 border-sky-200" : isHeat ? "from-amber-100 to-white text-amber-900 border-amber-200" : isStorm ? "from-red-100 to-white text-red-900 border-red-200" : "from-slate-100 to-white text-slate-800 border-slate-200"} border p-3.5 rounded-2xl transition-all duration-300`
    : `bg-linear-to-r ${activeObj.colorClass} border p-3.5 rounded-2xl transition-all duration-300`;

  const textColorClass = theme === "light" ? "text-slate-900" : "text-white";
  const descColorClass = theme === "light" ? "text-slate-600" : "text-slate-400";

  return (
    <AnimatePresence mode="wait">
      {!isDismissed ? (
        <motion.div
          key="weather-api-alert-card"
          id="weather-api-alert-box"
          initial={{ opacity: 0, y: -15, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ 
            opacity: 0, 
            x: 200, 
            height: 0,
            marginTop: 0,
            marginBottom: 0,
            paddingTop: 0,
            paddingBottom: 0,
            transition: {
              height: { delay: 0.1, duration: 0.2 },
              opacity: { duration: 0.25 },
              x: { duration: 0.25 }
            }
          }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className={containerStyleClass}
        >
          {/* Top Header Row */}
          <div className="flex justify-between items-center decoration-none select-none">
            <div className="flex items-center gap-2">
              {isFetched && !errorState ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-500 animate-pulse" title="Données météo réelles en ligne" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-amber-500" title="Données locales (mode hors-ligne)" />
              )}
              <span className={`text-[9px] font-black uppercase tracking-wider ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>
                {isFetched && !errorState ? "ALERTES METEO EN DIRECT (OPEN-METEO)" : "ALERTE METEO RDC"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-sans">
              {/* Debug button selector */}
              <button
                type="button"
                onClick={() => setShowDebug(!showDebug)}
                className={`text-[8px] font-mono font-black border px-1.5 py-0.5 rounded-md select-none transition-all cursor-pointer ${
                  showDebug 
                    ? "bg-purple-500/15 border-purple-500/40 text-purple-400 hover:bg-purple-500/25" 
                    : "bg-slate-500/10 border-slate-500/20 text-slate-400 hover:bg-slate-500/20"
                }`}
                title="Afficher les coordonnées de débogage"
              >
                🛠️ DEBUG {showDebug ? "OFF" : "ON"}
              </button>

              {isFloodAlarmActive && (
                <span 
                  className="text-[8px] font-mono font-black border px-1.5 py-0.5 rounded-md select-none bg-red-650/20 text-red-400 border-red-500/40 animate-pulse flex items-center gap-1 shadow-[0_0_8px_rgba(239,68,68,0.2)]"
                  title={`Zone à haut risque d'inondation de chaussée (Précipitations: ${currentRainSum.toFixed(1)} mm >= seuil de ${localizedThreshold.toFixed(1)} mm)`}
                >
                  <AlertTriangle className="w-2.5 h-2.5 text-red-500 shrink-0" />
                  ZONE INONDABLE
                </span>
              )}

              <span className={`text-[8px] font-mono font-black border px-1.5 py-0.5 rounded-md select-none ${currentBadge.bg}`}>
                {currentBadge.text}
              </span>
              <button
                type="button"
                onClick={handleSpeak}
                className={`p-1 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all cursor-pointer border border-transparent ${
                  isSpeaking 
                    ? "bg-emerald-500/10 text-emerald-450 border-emerald-550/30 animate-pulse" 
                    : "text-slate-450 hover:text-slate-200 hover:bg-slate-500/10"
                }`}
                title={lang === "fr" ? "Écouter l'alerte" : "Listen to weather alert"}
                id="weather-api-speak-btn"
              >
                {isSpeaking ? (
                  <VolumeX className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={fetchRealTimeWeather}
                disabled={loading}
                className={`p-1 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all text-slate-450 hover:text-slate-200 cursor-pointer ${loading ? "animate-spin" : ""}`}
                title="Actualiser la météo en direct"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="p-1 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all text-slate-450 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-all border border-transparent hover:border-rose-500/20"
                title="Masquer l'alerte météo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Developer Debug Log Overlay Panel */}
          <AnimatePresence>
            {showDebug && debugData && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-slate-900 border border-purple-500/20 p-2.5 rounded-xl space-y-1.5 font-mono text-[9px] text-purple-200 overflow-hidden shadow-inner select-all"
              >
                <div className="flex justify-between items-center border-b border-purple-500/10 pb-1">
                  <span className="font-extrabold text-purple-400 uppercase tracking-wider">📐 GPS DEV MODULE INFO</span>
                  <span className="text-[8px] bg-purple-500/20 px-1 rounded">200 OK</span>
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                  <div><span className="text-purple-400">Target Lat :</span> {debugData.lat}</div>
                  <div><span className="text-purple-400">Target Lon :</span> {debugData.lon}</div>
                  <div>
                    <span className="text-purple-400">Pluie :</span> {debugData.precipitation !== undefined ? `${debugData.precipitation.toFixed(1)} mm` : "Recherche..."}
                  </div>
                  <div>
                    <span className="text-purple-400">Seuil Local :</span> {isLocationFloodProne(debugData.resolvedName) ? "5.0 mm" : "10.0 mm"}
                  </div>
                  <div className="col-span-2 text-ellipsis overflow-hidden whitespace-nowrap">
                    <span className="text-purple-400">Source :</span> {debugData.source}
                  </div>
                  <div className="col-span-2 text-ellipsis overflow-hidden whitespace-nowrap">
                    <span className="text-purple-400">Location :</span> {debugData.resolvedName}
                  </div>
                </div>
                <div className="pt-1 border-t border-purple-500/10 flex flex-col gap-0.5 text-[8.5px]">
                  <span className="text-purple-400 font-extrabold">Query URL :</span>
                  <span className="bg-slate-950 p-1 rounded text-purple-300 font-mono select-all overflow-x-auto block">
                    {debugData.targetUrl}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Animating Weather Condition Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeObj.id}-${loading ? 'loading' : 'ready'}`}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className={`${bannerColorClass} relative overflow-hidden`}
            >
              <div className="flex items-start gap-3">
                {/* Temperature Widget Block */}
                <div className="p-2 bg-slate-950/80 rounded-xl border border-white/5 shadow-inner mt-0.5 select-none text-center flex flex-col justify-center items-center min-w-[50px] shrink-0">
                  {loading ? (
                    <RefreshCw className="w-5 h-5 text-blue-500 animate-spin my-1" />
                  ) : (
                    activeObj.icon
                  )}
                  <span className="text-[10px] font-mono font-black text-white mt-1 block tracking-tight">
                    {loading ? "--" : activeObj.temperature}
                  </span>
                </div>

                {/* Condition Text Blocks */}
                <div className="flex-1 min-w-0">
                  <h4 className={`font-black text-xs leading-tight tracking-tight ${textColorClass} truncate`}>
                    {loading ? "Chargement des coordonnées..." : activeObj.title}
                  </h4>
                  <div className={`flex items-center gap-1.5 text-[8.5px] font-extrabold uppercase font-mono mt-0.5 flex-wrap ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>
                    <span>Commune :</span>
                    <span className={theme === "light" ? "text-blue-700 font-bold font-sans" : "text-sky-300 font-bold font-sans"}>
                      {activeObj.commune}
                    </span>
                    {activeObj.precipitation !== undefined && (
                      <>
                        <span className="opacity-40">|</span>
                        <span className={isFloodAlarmActive ? "text-rose-500 font-black animate-pulse" : "text-emerald-400 font-bold"}>
                          Pluie : {activeObj.precipitation.toFixed(1)} mm
                        </span>
                      </>
                    )}
                  </div>
                  <p className={`text-[10px] leading-snug font-medium italic mt-1.5 ${descColorClass}`}>
                    "{loading ? "Interrogation de la base de données Open-Meteo pour votre coordonnée géocommunale..." : activeObj.alertText}"
                  </p>
                </div>
              </div>

              {/* Dynamic Moto Transport Safety Board */}
              <div className="mt-3 pt-2.5 border-t border-slate-700/20 text-[9.5px] leading-normal">
                <span className="font-black text-[9px] uppercase tracking-wider block mb-0.5 text-red-500">
                  Directive de Navigation GoMoto :
                </span>
                <p className={`${theme === "light" ? "text-slate-705 font-medium" : "text-slate-350 font-medium"}`}>
                  {loading ? "Réécriture de l'état de prudence routière rattaché à la station météorologique municipale..." : activeObj.recommendation}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          key="weather-api-alert-restore"
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ duration: 0.2 }}
          className="flex justify-end"
        >
          <button
            type="button"
            onClick={() => setIsDismissed(false)}
            className={`text-[9.5px] font-black px-3.5 py-2 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 hover:shadow-md focus:outline-none focus:ring-1 focus:ring-indigo-400/50 hover:scale-[1.03] duration-150 ${
              theme === "light"
                ? "bg-slate-50 border-slate-250 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                : "bg-slate-900 border-slate-800 text-slate-305 hover:bg-slate-850 hover:text-white"
            }`}
            id="restore-weather-btn"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span>🌤️ Consulter la météo ({activeObj.commune.split(",")[0]})</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
