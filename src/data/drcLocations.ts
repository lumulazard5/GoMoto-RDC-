/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Province {
  id: string;
  name: string;
  cities: {
    name: string;
    communes: string[];
  }[];
}

export const drcProvinces: Province[] = [
  {
    id: "kinshasa",
    name: "Kinshasa",
    cities: [
      {
        name: "Kinshasa",
        communes: [
          "Gombe", "Limete", "Bandalungwa", "Kasa-Vubu", "Ngaliema", "Kalamu", "Lemba", 
          "Matete", "N'djili", "Masina", "Lingwala", "Barumbu", "Kinshasa", "Kintambo", 
          "Ngiri-Ngiri", "Bumbu", "Makala", "Selembao", "Mont-Ngafula", "N'sele", "Maluku"
        ]
      }
    ]
  },
  {
    id: "haut_katanga",
    name: "Haut-Katanga",
    cities: [
      { name: "Lubumbashi", communes: ["Lubumbashi", "Kampemba", "Kamalondo", "Kenia", "Katuba", "Ruashi", "Annexe"] },
      { name: "Likasi", communes: ["Likasi", "Kikula", "Shituru", "Panda", "Tshamilemba"] },
      { name: "Kasumbalesa", communes: ["Kasumbalesa", "Musoshi", "Kinsenda"] }
    ]
  },
  {
    id: "lualaba",
    name: "Lualaba",
    cities: [
      { name: "Kolwezi", communes: ["Dilala", "Manika"] },
      { name: "Kasaji", communes: ["Kasaji", "Kisenge"] }
    ]
  },
  {
    id: "sud_kivu",
    name: "Sud-Kivu",
    cities: [
      { name: "Bukavu", communes: ["Ibanda", "Kadutu", "Bagira"] },
      { name: "Uvira", communes: ["Uvira", "Kalundu", "Mulongwe"] },
      { name: "Baraka", communes: ["Baraka", "Lualaba", "Katanga"] }
    ]
  },
  {
    id: "nord_kivu",
    name: "Nord-Kivu",
    cities: [
      { name: "Goma", communes: ["Goma", "Karisimbi"] },
      { name: "Butembo", communes: ["Kimemi", "Bulengera", "Rugetsi", "Mususa"] },
      { name: "Beni", communes: ["Bungulu", "Ruwenzori", "Muhekera", "Beu"] }
    ]
  },
  {
    id: "tshopo",
    name: "Tshopo",
    cities: [
      { name: "Kisangani", communes: ["Makiso", "Tshopo", "Mangobo", "Kabondo", "Kisangani", "Lubunga"] }
    ]
  },
  {
    id: "kasai_central",
    name: "Kasaï Central",
    cities: [
      { name: "Kananga", communes: ["Kananga", "Katoka", "Lula", "Nganza", "Ndesha"] }
    ]
  },
  {
    id: "kasai_oriental",
    name: "Kasaï Oriental",
    cities: [
      { name: "Mbuji-Mayi", communes: ["Bipemba", "Dibindi", "Kanshi", "Muya", "Diulu"] }
    ]
  },
  {
    id: "kongo_central",
    name: "Kongo Central",
    cities: [
      { name: "Matadi", communes: ["Matadi", "Mvuzi", "Nzanza"] },
      { name: "Boma", communes: ["Kabondo", "Nzadi", "Mabu"] },
      { name: "Muanda", communes: ["Muanda Centre", "Kitsanga"] },
      { name: "Mbanza-Ngungu", communes: ["Mbanza-Ngungu Centre", "Noki"] }
    ]
  },
  {
    id: "kwilu",
    name: "Kwilu",
    cities: [
      { name: "Kikwit", communes: ["Lukolela", "Lukemi", "Nzinda", "Lwano"] },
      { name: "Bandundu", communes: ["Disasi", "Basoko", "Mayoyo"] }
    ]
  },
  { id: "kwango", name: "Kwango", cities: [{ name: "Kenge", communes: ["Kenge Centre", "Manasi"] }] },
  { id: "mai_ndombe", name: "Mai-Ndombe", cities: [{ name: "Inongo", communes: ["Inongo Centre", "Mpolo"] }] },
  { id: "ituri", name: "Ituri", cities: [{ name: "Bunia", communes: ["Nyakasanza", "Shari", "Mbunya"] }] },
  { id: "haut_uele", name: "Haut-Uele", cities: [{ name: "Isiro", communes: ["Mendambo", "Mambaya"] }] },
  { id: "bas_uele", name: "Bas-Uele", cities: [{ name: "Buta", communes: ["Buta Centre", "Babua"] }] },
  { id: "nord_ubangi", name: "Nord-Ubangi", cities: [{ name: "Gbadolite", communes: ["Gbadolite Centre", "Nzakara"] }] },
  { id: "sud_ubangi", name: "Sud-Ubangi", cities: [{ name: "Gemena", communes: ["Gemena Centre", "Mombonga"] }] },
  { id: "mongala", name: "Mongala", cities: [{ name: "Lisala", communes: ["Lisala Centre", "Konga"] }] },
  { id: "equateur", name: "Équateur", cities: [{ name: "Mbandaka", communes: ["Mbandaka", "Wangata"] }] },
  { id: "tshuapa", name: "Tshuapa", cities: [{ name: "Boende", communes: ["Boende Centre", "Tshuapa"] }] },
  { id: "kasai", name: "Kasaï", cities: [{ name: "Tshikapa", communes: ["Kanzala", "Mabondo", "Dibumba", "Mbumba"] }] },
  { id: "lomami", name: "Lomami", cities: [{ name: "Kabinda", communes: ["Kabinda Centre", "Madingi"] }] },
  { id: "sankuru", name: "Sankuru", cities: [{ name: "Lusambo", communes: ["Lusambo Centre", "Sankuru"] }] },
  { id: "maniema", name: "Maniema", cities: [{ name: "Kindu", communes: ["Alunguli", "Kasuku", "Mikelenge"] }] },
  { id: "haut_lomami", name: "Haut-Lomami", cities: [{ name: "Kamina", communes: ["Kamina Centre", "Sobongo"] }] },
  { id: "tanganyika", name: "Tanganyika", cities: [{ name: "Kalemie", communes: ["Kalemie Centre", "Lukuga"] }] }
];

export const mockQuartiersByCommune: Record<string, string[]> = {
  "Gombe": ["Golf", "Haut Commandement", "Linité", "Gombe Centre", "Rivière", "Socimat"],
  "Limete": ["Salongo", "Mombele", "Mososo", "Kingabwa", "Industrial", "Funa", "Residentiel"],
  "Bandalungwa": ["Bandal-Synkin", "Bandal-Makelele", "Bandal-Adoula", "Bandal-Moulaert", "Bandal-Tshibangu"],
  "Kasa-Vubu": ["Gigi", "Lubumbashi", "Kasa-Vubu Centre", "Salongo"],
  "Ngaliema": ["Ma Campagne", "Binza Delvaux", "Binza Pigeon", "Binza Ozone", "Kimbwala", "Mimosas", "Kinsuka"],
  "Kalamu": ["Matonge", "Yolo-Nord", "Yolo-Sud", "Kalamu II", "Kauka"],
  "Ibanda": ["Nyalukemba", "Ndendere", "Panzi"],
  "Kadutu": ["Nyamugo", "Cahi", "Kasha", "Kasali"],
  "Goma": ["Les Volcans", "Mikeno", "Mapendo", "Katindo"],
  "Karisimbi": ["Majeshi", "Mugunga", "Ndosho", "Kasika"],
  "Lubumbashi": ["Lido", "Golf-Météo", "Golf-Plateau", "Bel-Air", "Mampala"],
  "Kamalondo": ["Kamalondo Est", "Kamalondo Ouest"],
  "Kenia": ["Kenia I", "Kenia II", "Kenia III"],
  "Dilala": ["Biashara", "Joli Site", "Mutoshi", "Mualaba"],
  "Manika": ["Kasulo", "Kando", "Luilu", "Kamanyola"]
};

export const defaultQuartiers = ["Quartier Centre-Ville", "Quartier Commercial", "Quartier Populaire", "Quartier Résidentiel", "Quartier Industriel"];

export function getQuartiersForCommune(commune: string): string[] {
  return mockQuartiersByCommune[commune] || defaultQuartiers;
}

export const mockLocalities = ["Localité A", "Localité B", "Localité C", "Localité Rurale", "Localité Urbaine"];

export const mockAvenues = [
  "Avenue de la Libération",
  "Avenue du 30 Juin",
  "Avenue Kasa-Vubu",
  "Avenue Kabinda",
  "Avenue des Huileries",
  "Avenue Mondjiba",
  "Avenue Colonel Mondjiba",
  "Avenue de la Justice",
  "Avenue Colonel Tschatshi",
  "Avenue Nguma",
  "Avenue Université",
  "Avenue de l'Équateur",
  "Avenue des Aviateurs",
  "Avenue By-Pass",
  "Avenue Lumumba",
  "Avenue du Commerce",
  "Avenue Forces Armées",
  "Avenue Kimbangu"
];

export function getRandomAvenue(): string {
  return mockAvenues[Math.floor(Math.random() * mockAvenues.length)];
}
