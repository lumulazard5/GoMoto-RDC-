import React, { useState, useEffect } from 'react';
import { getAccessToken, useAuth } from '../hooks/useAuth';
import { 
  FileText, 
  CheckCircle, 
  Plus, 
  Trash2, 
  Copy, 
  ExternalLink, 
  Sparkles, 
  Check, 
  Loader2, 
  Settings, 
  ArrowRight,
  Info
} from 'lucide-react';

interface QuestionConfig {
  title: string;
  type: 'text' | 'choice';
  options: string[]; // only for choice type
}

interface CreatedForm {
  id: string;
  title: string;
  description: string;
  responderUri: string;
  editUri: string;
  createdDate: string;
}

const TEMPLATES = [
  {
    id: 'feedback_ride',
    title: 'Évaluation Course GoMoto RDC',
    description: 'Recueillir l\'avis des passagers sur le comportement, la sécurité et la courtoisie du motard.',
    questions: [
      { title: 'Nom du Chauffeur / Numéro de plaque', type: 'text', options: [] },
      { 
        title: 'Comment évaluez-vous la sécurité de conduite ?', 
        type: 'choice', 
        options: ['Très sûre (5)', 'Sûre (4)', 'Modérée (3)', 'Dangereuse (1-2)'] 
      },
      { 
        title: 'Courtoisie et convivialité du motard', 
        type: 'choice', 
        options: ['Excellent (5)', 'Très bon (4)', 'Moyen (3)', 'Désagréable (1-2)'] 
      },
      { title: 'Partagez vos suggestions d\'amélioration', type: 'text', options: [] }
    ]
  },
  {
    id: 'bike_inspection',
    title: 'Fiche d\'Inspection Technique Hebdomadaire',
    description: 'Permettre aux vérificateurs d\'enregistrer le statut mécanique de la moto partenaire.',
    questions: [
      { title: 'Matricule de la Moto', type: 'text', options: [] },
      { 
        title: 'État général des freins', 
        type: 'choice', 
        options: ['Parfait état', 'Usure modérée (à surveiller)', 'Défectueux (Urgent !)'] 
      },
      { 
        title: 'Présence des deux casques homologués', 
        type: 'choice', 
        options: ['Oui, les deux sont présents', 'Chauffeur uniquement', 'Aucun casque'] 
      },
      { title: 'Kilométrage actuel', type: 'text', options: [] },
      { title: 'Remarques additionnelles', type: 'text', options: [] }
    ]
  },
  {
    id: 'onboarding_quiz',
    title: 'Sondage Intégration Chauffeurs',
    description: 'Mesurer la satisfaction globale des conducteurs partenaires durant leur intégration.',
    questions: [
      { title: 'Depuis combien de jours utilisez-vous GoMoto ?', type: 'text', options: [] },
      { 
        title: 'L\'interface de paiement REPARO est-elle simple ?', 
        type: 'choice', 
        options: ['Très claire', 'Passable', 'Compliquée (Nécessite formation)'] 
      },
      { title: 'Quelle fonctionnalité majeure manque-t-il sur votre application ?', type: 'text', options: [] }
    ]
  }
];

export default function FormsManager({ onClose }: { onClose: () => void }) {
  const { loginWithGoogle } = useAuth();
  const token = getAccessToken();

  const [createdForms, setCreatedForms] = useState<CreatedForm[]>(() => {
    const saved = localStorage.getItem('gomoto_created_google_forms');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  
  // Custom Form Form States
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [questions, setQuestions] = useState<QuestionConfig[]>([
    { title: 'Nom et Prénom', type: 'text', options: [] },
    { title: 'Votre niveau de satisfaction globale', type: 'choice', options: ['Excellent', 'Très Bon', 'Moyen', 'À améliorer'] }
  ]);

  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [justCreatedForm, setJustCreatedForm] = useState<CreatedForm | null>(null);

  useEffect(() => {
    localStorage.setItem('gomoto_created_google_forms', JSON.stringify(createdForms));
  }, [createdForms]);

  const handleCopyLink = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, { title: 'Nouvelle Question', type: 'text', options: [] }]);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleUpdateQuestion = (idx: number, field: keyof QuestionConfig, value: any) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
    setQuestions(updated);
  };

  const handleAddOption = (qIdx: number) => {
    const updated = [...questions];
    updated[qIdx].options.push(`Rép ${updated[qIdx].options.length + 1}`);
    setQuestions(updated);
  };

  const handleRemoveOption = (qIdx: number, oIdx: number) => {
    const updated = [...questions];
    updated[qIdx].options = updated[qIdx].options.filter((_, i) => i !== oIdx);
    setQuestions(updated);
  };

  const handleUpdateOption = (qIdx: number, oIdx: number, val: string) => {
    const updated = [...questions];
    updated[qIdx].options[oIdx] = val;
    setQuestions(updated);
  };

  const handleApplyTemplate = (tpl: typeof TEMPLATES[0]) => {
    setFormTitle(tpl.title);
    setFormDescription(tpl.description);
    setQuestions(tpl.questions.map(q => ({
      title: q.title,
      type: q.type as 'text' | 'choice',
      options: [...q.options]
    })));
  };

  const generateGoogleForm = async () => {
    if (!token) return;
    if (!formTitle.trim()) {
      alert("Veuillez donner un titre à votre formulaire.");
      return;
    }

    try {
      setLoading(true);
      setJustCreatedForm(null);

      // Step 1: Create the empty Google Form
      const createRes = await fetch('https://forms.googleapis.com/v1/forms', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          info: {
            title: formTitle,
            description: formDescription || "Généré via l'interface administrative GoMoto RDC."
          }
        })
      });

      if (!createRes.ok) {
        throw new Error(`Failed to create Google Form: ${createRes.statusText}`);
      }

      const formObj = await createRes.json();
      const formId = formObj.formId;
      const responderUri = formObj.responderUri;

      // Step 2: Build the questions list in Google Forms schema
      const requests = questions.map((q, idx) => {
        const item: any = {
          title: q.title,
          questionItem: {
            question: {
              required: true
            }
          }
        };

        if (q.type === 'choice') {
          item.questionItem.question.choiceQuestion = {
            type: 'RADIO',
            options: q.options.map(opt => ({ value: opt }))
          };
        } else {
          item.questionItem.question.textQuestion = {
            paragraph: q.title.toLowerCase().includes('commentaire') || q.title.toLowerCase().includes('remarque') || q.title.toLowerCase().includes('suggestion')
          };
        }

        return {
          createItem: {
            item: item,
            location: {
              index: idx
            }
          }
        };
      });

      // Step 3: Run patch request to upload questions
      const batchRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests })
      });

      if (!batchRes.ok) {
        throw new Error(`Failed to add questions to form: ${batchRes.statusText}`);
      }

      const editUri = `https://docs.google.com/forms/d/${formId}/edit`;
      const finalForm: CreatedForm = {
        id: formId,
        title: formTitle,
        description: formDescription,
        responderUri: responderUri,
        editUri: editUri,
        createdDate: new Date().toLocaleDateString('fr-FR') + ' à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };

      setCreatedForms(prev => [finalForm, ...prev]);
      setJustCreatedForm(finalForm);
      setActiveTab('history');
      
      // Reset custom creator form
      setFormTitle('');
      setFormDescription('');
      setQuestions([
        { title: 'Nom et Prénom', type: 'text', options: [] },
        { title: 'Votre niveau de satisfaction globale', type: 'choice', options: ['Excellent', 'Très Bon', 'Moyen', 'À améliorer'] }
      ]);

      alert(`Votre Google Form "${finalForm.title}" a été généré avec succès !`);

    } catch (error: any) {
      console.error(error);
      alert(`Erreur de génération : ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistoryItem = (id: string) => {
    if (confirm("Voulez-vous supprimer ce formulaire de votre historique local GoMoto ? (Le formulaire original sur Google Drive restera inchangé)")) {
      setCreatedForms(createdForms.filter(f => f.id !== id));
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200 font-sans">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-800 p-5 flex items-center justify-between text-white border-b border-purple-800">
          <div className="flex items-center gap-2.5">
            <div className="bg-purple-100 p-1.5 rounded-lg text-purple-800 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-1.5">
                Intégration Google Forms
                <span className="bg-purple-900/40 text-[9px] text-purple-200 px-2 py-0.5 rounded-md font-bold uppercase tracking-widest border border-purple-500/20 shadow-sm">BETA RDC</span>
              </h3>
              <p className="text-[10px] text-purple-200 mt-0.5">Créez et déployez des questionnaires officiels de contrôle & satisfaction pour GoMoto</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-white hover:text-purple-100 font-bold text-xs uppercase px-3 py-1.5 hover:bg-white/10 rounded-xl transition-all"
          >
            Fermer
          </button>
        </div>

        {/* Toolbar tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs px-2.5 py-1">
          <button 
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 font-extrabold uppercase transition-colors relative ${activeTab === 'create' ? 'text-purple-700 border-b-2 border-purple-700' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Nouveau Formulaire
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 font-extrabold uppercase transition-colors relative flex items-center gap-1.5 ${activeTab === 'history' ? 'text-purple-700 border-b-2 border-purple-700' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Formulaires Générés
            {createdForms.length > 0 && (
              <span className="bg-purple-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">{createdForms.length}</span>
            )}
          </button>
        </div>
        
        {/* Main Panel Body */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-100/40">
          {!token ? (
            <div className="text-center py-12 space-y-4 max-w-sm mx-auto">
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-amber-800">
                <p className="text-xs font-semibold leading-relaxed">
                  L'intégration requiert une authentification avec votre compte Google autorisé à utiliser la console Forms API.
                </p>
              </div>
              <button 
                type="button"
                onClick={loginWithGoogle}
                className="w-full py-3 bg-purple-600 text-white hover:bg-purple-700 rounded-2xl font-black uppercase text-xs shadow-md shadow-purple-600/10 transition-all flex items-center justify-center gap-2"
              >
                Autoriser Google Forms & Synchroniser
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'create' && (
                <div className="space-y-6">
                  {/* Presets & Templates */}
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Modèles Prêts à l'Emploi GoMoto
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {TEMPLATES.map(tpl => (
                        <div 
                          key={tpl.id}
                          onClick={() => handleApplyTemplate(tpl)}
                          className="bg-white border border-slate-200/90 rounded-2xl p-3.5 cursor-pointer hover:border-purple-500 hover:shadow-md transition-all text-left flex flex-col justify-between group"
                        >
                          <div>
                            <span className="block font-black text-xs text-slate-900 group-hover:text-purple-700 transition-colors">{tpl.title}</span>
                            <span className="block text-[9px] text-slate-500 font-medium leading-relaxed mt-1">{tpl.description}</span>
                          </div>
                          <div className="flex items-center justify-between text-[9px] text-purple-700 font-bold border-t border-slate-100 pt-2.5 mt-3">
                            <span>{tpl.questions.length} Questions</span>
                            <span className="flex items-center gap-0.5">Appliquer <ArrowRight className="w-3 h-3" /></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Form config inputs */}
                  <div className="bg-white rounded-2xl border border-slate-250/80 p-5 space-y-4 shadow-sm text-left">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Titre principal du Google Formulaire</label>
                      <input 
                        type="text" 
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="Ex: Évaluation Sécurité Route Nationale 1 (RN1)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all shadow-inner"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Description administrative</label>
                      <textarea 
                        rows={2}
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="Ex: Formulaire d'évaluation d'État mensuelle sur la conduite urbaine."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all shadow-inner resize-none"
                      />
                    </div>
                  </div>

                  {/* Dynamic Questions Panel */}
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Questions incluses ({questions.length})</span>
                      <button 
                        type="button"
                        onClick={handleAddQuestion}
                        className="bg-white border border-slate-200 hover:border-purple-600 text-purple-700 font-bold text-[10px] px-3 py-1 rounded-lg transition-all flex items-center gap-1 uppercase"
                      >
                        <Plus className="w-3.5 h-3.5" /> Ajouter Question
                      </button>
                    </div>

                    <div className="space-y-3">
                      {questions.map((q, qIdx) => (
                        <div key={qIdx} className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm text-left relative group">
                          
                          {/* Close/Remove icon */}
                          <button 
                            type="button" 
                            onClick={() => handleRemoveQuestion(qIdx)}
                            className="absolute right-3.5 top-3.5 text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-slate-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="md:col-span-2">
                              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Intitulé de la Question</label>
                              <input 
                                type="text"
                                value={q.title}
                                onChange={(e) => handleUpdateQuestion(qIdx, 'title', e.target.value)}
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Type de Saisie</label>
                              <select
                                value={q.type}
                                onChange={(e) => handleUpdateQuestion(qIdx, 'type', e.target.value)}
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
                              >
                                <option value="text">Réponse de texte libre</option>
                                <option value="choice">Choix multiple (Radio Buttons)</option>
                              </select>
                            </div>
                          </div>

                          {/* Options config if Choice multiple */}
                          {q.type === 'choice' && (
                            <div className="mt-3.5 bg-slate-50/70 rounded-xl p-3 border border-slate-150/80 space-y-2">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="block text-[8px] font-extrabold text-slate-500 uppercase">Options proposées (Choix unique)</span>
                                <button 
                                  type="button"
                                  onClick={() => handleAddOption(qIdx)}
                                  className="text-[8px] font-bold text-purple-700 bg-white border border-purple-200/60 px-2 py-0.5 rounded hover:bg-purple-50"
                                >
                                  + Ajouter Option
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {q.options.map((opt, oIdx) => (
                                  <div key={oIdx} className="flex items-center gap-1.5">
                                    <input 
                                      type="text" 
                                      value={opt}
                                      onChange={(e) => handleUpdateOption(qIdx, oIdx, e.target.value)}
                                      className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-slate-800"
                                    />
                                    <button 
                                      type="button"
                                      onClick={() => handleRemoveOption(qIdx, oIdx)}
                                      className="text-slate-400 hover:text-red-500 p-0.5"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submission and trigger details */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-purple-600" />
                      L'outil utilisera l'API Google Forms d'État de votre console cloud.
                    </p>
                    <button
                      type="button"
                      disabled={loading || questions.length === 0}
                      onClick={generateGoogleForm}
                      className="bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs uppercase px-6 py-3 rounded-2xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-55"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Génération du Google Form...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Générer sur Google Drive
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  {/* Display newly created form highlight */}
                  {justCreatedForm && (
                     <div className="bg-emerald-50 border border-emerald-250 p-4 rounded-2xl text-left space-y-3.5 animate-bounce-short">
                       <span className="bg-emerald-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded">Vient d'être validé !</span>
                       <div className="flex justify-between items-start">
                         <div>
                           <h4 className="font-extrabold text-sm text-slate-900">{justCreatedForm.title}</h4>
                           <p className="text-[10px] text-slate-600 mt-1">{justCreatedForm.description || "Pas de description"}</p>
                         </div>
                       </div>
                       
                       <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-emerald-200">
                         <a 
                           href={justCreatedForm.responderUri} 
                           target="_blank" 
                           rel="noreferrer"
                           className="bg-emerald-600 text-white font-bold text-[10px] px-3.5 py-2 rounded-xl flex items-center gap-1 uppercase hover:bg-emerald-700 transition"
                         >
                           <ExternalLink className="w-3 h-3" /> Ouvrir le Questionnaire Client
                         </a>
                         <a 
                           href={justCreatedForm.editUri} 
                           target="_blank" 
                           rel="noreferrer"
                           className="bg-slate-900 text-white font-bold text-[10px] px-3.5 py-2 rounded-xl flex items-center gap-1 uppercase hover:bg-slate-850 transition"
                         >
                           <Settings className="w-3 h-3 text-purple-400" /> Options d'Édition Google Drive
                         </a>
                         <button
                           type="button"
                           onClick={() => handleCopyLink(justCreatedForm.responderUri, justCreatedForm.id)}
                           className="bg-white border border-slate-200 text-slate-700 hover:text-slate-900 font-bold text-[10px] px-3.5 py-2 rounded-xl flex items-center gap-1 uppercase"
                         >
                           {copiedId === justCreatedForm.id ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                           {copiedId === justCreatedForm.id ? "Copié !" : "Copier le Lien unique"}
                         </button>
                       </div>
                     </div>
                  )}

                  {createdForms.length === 0 ? (
                    <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl text-slate-500">
                      <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-xs font-bold">Aucun formulaire Google Forms n'a été créé via cette console.</p>
                      <p className="text-[10px] mt-1 text-slate-400">Configurez votre premier formulaire à l'onglet "Nouveau Formulaire".</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {createdForms.map(form => (
                        <div key={form.id} className="bg-white border border-slate-200 rounded-2xl p-4 text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-purple-300 transition-colors shadow-sm">
                          <div className="space-y-1 flex-1">
                            <span className="block font-black text-xs text-slate-900 flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-purple-600 animate-pulse"></span>
                              {form.title}
                            </span>
                            <span className="block text-[9px] text-slate-500 font-medium leading-relaxed max-w-lg">{form.description}</span>
                            <span className="block text-[8px] text-slate-400 font-bold uppercase">Ajouté le: {form.createdDate}</span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-1.5">
                            <a 
                              href={form.responderUri} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="bg-purple-100 text-purple-800 hover:bg-purple-200 font-bold text-[9px] py-2 px-3 rounded-xl flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" /> Répondre
                            </a>
                            <a 
                              href={form.editUri} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-[9px] py-2 px-3 rounded-xl flex items-center gap-1"
                            >
                              Éditer Drive
                            </a>
                            <button
                              onClick={() => handleCopyLink(form.responderUri, form.id)}
                              className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-[9px] py-2 px-2 rounded-xl"
                            >
                              {copiedId === form.id ? "Copié !" : "Lien"}
                            </button>
                            <button 
                              onClick={() => handleDeleteHistoryItem(form.id)}
                              className="p-2 border border-red-100 text-red-500 rounded-xl hover:bg-red-50 ml-1.5 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
