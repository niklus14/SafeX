import { Camera, X, Zap } from 'lucide-react';
import { useApp } from '../store';

const PRESETS = [
  {
    photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApPoPK5Fs5u_uonw9pfYayadW5sU9lXPM5NlcTfpy5eKet693W-L2wUr3p2ujpYbbNhtmtpSj8AcqYGtiAHlwCDjalBF96QXXkad7QAVZRXMRIVUg5Ulguy2ixxLU3Se5SfNRddtR4miHvMRJ8NKEFD1d7H7mc6Fo_9hGvgUcRJh23mQGe8JYm4IObgGV-2SsN3gNQL6QXap4W3ERtBxDpzfBwEXvcWjMaF_NGiHFw15s8JJ4gIHyq8IRgZP5czdDLD7gBzaHDv58',
    type: 'Yol Təmiri',
    defaultDesc: 'Küçədə dərin asfalt çatları əmələ gəlib, piyadaların və maşınların keçidini əhəmiyyətli dərəcədə çətinləşdirir.',
    location: 'Səbail r., Nizami küç.',
  },
  {
    photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAuU1oQQGPtYyg6p-O7y36z59AtZ2pUk8MvZ9oA2qDm4NZRtVbuIahYpB1a08RxPkvW3oQU03-U94adhi8UvtkQljTtVBkAj49IzA7wwZZmwn1xnGbHnrbbT6P6SvOnTl_AF6iXW9Vl7FHSDo2lBeK7woKfFTsDWfMVj6gw0G3tStgcAyhKBPtT1knhXRhFTzP-RdWchzO8GIVB-5vSVN6o7dpw0rR5aYFqjzvQT_Grh0ZwRVwUtjLGI8yZRmVQ2Jf_z-rImNW7Po0',
    type: 'Fontan Təmiri',
    defaultDesc: 'Parkdakı tarixi fontanın su təzyiqi tamamilə zəifləyib, bəzi fəvvarələr isə ümumiyyətlə işləmir.',
    location: 'Fəvvarələr meydanı, Baku',
  },
  {
    photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDw9h3NVwkDuK_V6dhRpJ-J9TjEDZtZU5jJXS-ds24PuDHV_9lwLcLpw4KVea4MrxjY958ZAuTxHDi8I1l_Rm3wImMYcIcbUkJl4vWIagKxlH8KOxqyRmhxmfTW6lns_5TTV9dNqaF-FfDQSpKhlBXEd9r3xFWfVwxmyczx5_XhHqtV2U7HpFX0O252qVH8T_dzODE86mkkwHUsnAN9DcpD6SD2_nMpxKIPaN6g1I-UYmO9SaBHd0u7QTBQqjsQP5ZnDnpAXZLKbE',
    type: 'Sanitariya və Təmizlik',
    defaultDesc: 'Məişət tullantıları qutularının ətrafına zibillər toplanıb, zibil maşınının gəlməsi gecikir.',
    location: 'Binəqədi r., M.Ə.Rəsulzadə qəs.',
  },
];

export default function CameraScreen() {
  const { state, dispatch, navigate, toast } = useApp();

  function selectPreset() {
    const p = PRESETS[Math.floor(Math.random() * PRESETS.length)];
    dispatch({
      type: 'SET_DRAFT',
      patch: { photo: p.photoUrl, type: p.type, description: p.defaultDesc, location: p.location },
    });
  }

  function shutter() {
    if (!state.draft.photo) selectPreset();
    navigate('create-details');
    toast('Fotoşəkil uğurla çəkildi. Açılış formu doldurulur.', 'success');
  }

  const photo = state.draft.photo || PRESETS[0].photoUrl;

  return (
    <div className="absolute inset-0 z-50 bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex justify-between items-center p-4 text-white z-10">
        <button
          onClick={() => navigate('feed')}
          className="p-2 rounded-full bg-black/40 backdrop-blur-md"
        >
          <X size={20} />
        </button>
        <span className="font-extrabold text-sm tracking-widest uppercase">Kamera süzgəci</span>
        <button className="p-2 rounded-full bg-black/40 backdrop-blur-md text-[#fadbd9]">
          <Zap size={20} />
        </button>
      </div>

      {/* Viewfinder */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        <div className="absolute z-20 w-72 h-72 border-2 border-white/20 rounded-[32px] pointer-events-none">
          <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white -translate-x-1 -translate-y-1 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white translate-x-1 -translate-y-1 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white -translate-x-1 translate-y-1 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white translate-x-1 translate-y-1 rounded-br-xl" />
        </div>
        <img className="w-full h-full object-cover select-none" src={photo} alt="Viewfinder" />
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-semibold z-10 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
          Avtomatik fokus aktivdir
        </div>
      </div>

      {/* Shutter */}
      <div className="h-44 bg-black flex flex-col justify-center items-center px-6 gap-3 shrink-0">
        <p className="text-white/60 text-xs font-semibold mb-1">Şəhər problemini hədəfə alın və düyməni sıxın</p>
        <div className="flex items-center justify-around w-full max-w-xs">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/20">
            <img className="w-full h-full object-cover" src={photo} alt="Gallery" />
          </div>
          <button
            onClick={shutter}
            className="w-20 h-20 bg-white rounded-full p-1 transition-transform transform active:scale-90"
          >
            <div className="w-full h-full rounded-full border-4 border-black flex items-center justify-center">
              <div className="w-14 h-14 bg-brand-primary rounded-full flex items-center justify-center text-white">
                <Camera size={24} />
              </div>
            </div>
          </button>
          <div className="w-12" />
        </div>
      </div>
    </div>
  );
}
