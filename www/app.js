'use strict';

(() => {

  // ---------- Constantes ----------

  const COLORS = {
    pyjama: '#b9a7f2',
    histoire: '#f6c453',
    biberon: '#f3e9d2',
    dents: '#7fd8c8',
    calin: '#f2a2c0',
    pot: '#9fd8e8',
    couche: '#f5d2ad',
    bain: '#7fb8e8',
    debarbouillage: '#cde6f5',
    massage: '#f0c39e',
    medicament: '#f0a8a8',
    rangement: '#c9b98e',
    chambre: '#a8b4e8',
    veilleuse: '#f6e7a0',
    doudou: '#d9a96f',
    eau: '#9fc4f0',
    animal: '#ffb38a',
    tetee: '#f3dcc8',
    berceuse: '#c8a8e8',
    journee: '#b5d98a',
    respiration: '#93d9c0',
    priere: '#e3c7e8',
    bisous: '#f7b3ba',
  };
  const FALLBACK_COLOR = '#cbd5ff';

  // cat : hyg = Hygiène & soins, nuit = Préparer la nuit, calme = Moments calmes
  const DEFAULT_PHASES = [
    { id: 'pyjama', emoji: '👕', label: 'Pyjama', minutes: 5, enabled: true, cat: 'nuit' },
    { id: 'histoire', emoji: '📖', label: 'Histoire', minutes: 5, enabled: true, cat: 'calme' },
    { id: 'biberon', emoji: '🍼', label: 'Biberon', minutes: 15, enabled: true, cat: 'calme' },
    { id: 'dents', emoji: '🪥', label: 'Dents', minutes: 5, enabled: true, cat: 'hyg' },
    { id: 'calin', emoji: '🤗', label: 'Câlin', minutes: 5, enabled: true, cat: 'calme' },
    { id: 'pot', emoji: '🚽', label: 'Pot', minutes: 5, enabled: false, cat: 'hyg' },
    { id: 'couche', emoji: '👶', label: 'Couche', minutes: 3, enabled: false, cat: 'hyg' },
    { id: 'bain', emoji: '🛁', label: 'Bain', minutes: 15, enabled: false, cat: 'hyg' },
    { id: 'debarbouillage', emoji: '🧼', label: 'Débarbouillage', minutes: 3, enabled: false, cat: 'hyg' },
    { id: 'massage', emoji: '🧴', label: 'Crème / massage', minutes: 5, enabled: false, cat: 'hyg' },
    { id: 'medicament', emoji: '💊', label: 'Médicament', minutes: 3, enabled: false, cat: 'hyg' },
    { id: 'rangement', emoji: '🧹', label: 'Ranger les jouets', minutes: 5, enabled: false, cat: 'nuit' },
    { id: 'chambre', emoji: '🪟', label: 'Préparer la chambre', minutes: 3, enabled: false, cat: 'nuit' },
    { id: 'veilleuse', emoji: '💡', label: 'Veilleuse', minutes: 2, enabled: false, cat: 'nuit' },
    { id: 'doudou', emoji: '🧸', label: 'Doudou & tétine', minutes: 3, enabled: false, cat: 'nuit' },
    { id: 'eau', emoji: '🚰', label: "Verre d'eau", minutes: 2, enabled: false, cat: 'nuit' },
    { id: 'animal', emoji: '🐠', label: "Nourrir l'animal", minutes: 3, enabled: false, cat: 'nuit' },
    { id: 'tetee', emoji: '🤱', label: 'Tétée', minutes: 15, enabled: false, cat: 'calme' },
    { id: 'berceuse', emoji: '🎵', label: 'Berceuse', minutes: 5, enabled: false, cat: 'calme' },
    { id: 'journee', emoji: '💬', label: 'Raconter sa journée', minutes: 5, enabled: false, cat: 'calme' },
    { id: 'respiration', emoji: '🧘', label: 'Respiration calme', minutes: 3, enabled: false, cat: 'calme' },
    { id: 'priere', emoji: '🙏', label: 'Prière', minutes: 5, enabled: false, cat: 'calme' },
    { id: 'bisous', emoji: '😘', label: 'Bisous à tous', minutes: 3, enabled: false, cat: 'calme' },
  ];

  // ---------- Traductions (10 langues les plus parlées) ----------

  const I18N = {
    fr: { name: 'Français', dir: 'ltr', s: {
      appTitle: 'Au dodo !', subtitle: 'Le rituel du coucher', start: 'Commencer le rituel',
      settings: 'Réglages', back: 'Retour', sounds: 'Sons', introAnim: 'Animation de départ',
      language: 'Langue', defaults: 'Valeurs par défaut', defaultsConfirm: 'Remettre les réglages par défaut ?',
      defaultsDone: 'Réglages réinitialisés', needOneStep: 'Il faut au moins une étape active',
      total: 'Durée totale : {n} min', minUnit: 'min', pause: 'Pause', resume: 'Reprendre',
      prevStep: 'Phase précédente', nextStep: 'Phase suivante', stop: 'Arrêter',
      stopConfirm: 'Arrêter le rituel ?', endTitle: 'Au dodo !', endMsg: 'Bonne nuit, fais de beaux rêves ✨',
      finish: 'Terminer', sleep: 'Au dodo !', tapSkip: "Touche l'écran pour passer",
      p_pyjama: 'Pyjama', p_histoire: 'Histoire', p_biberon: 'Biberon', p_dents: 'Dents', p_calin: 'Câlin',
      myRitual: 'Mon rituel', catHyg: 'Hygiène & soins', catNight: 'Préparer la nuit', catCalm: 'Moments calmes',
      support: "Soutenir l'app",
      p_pot: 'Pot', p_couche: 'Couche', p_bain: 'Bain', p_debarbouillage: 'Débarbouillage',
      p_massage: 'Crème / massage', p_medicament: 'Médicament', p_rangement: 'Ranger les jouets',
      p_chambre: 'Préparer la chambre', p_veilleuse: 'Veilleuse', p_doudou: 'Doudou & tétine',
      p_eau: "Verre d'eau", p_animal: "Nourrir l'animal", p_tetee: 'Tétée', p_berceuse: 'Berceuse',
      p_journee: 'Raconter sa journée', p_respiration: 'Respiration calme', p_priere: 'Prière', p_bisous: 'Bisous à tous',
      tabSteps: 'Étapes', tabApp: 'Application',
    } },
    en: { name: 'English', dir: 'ltr', s: {
      appTitle: 'Bedtime!', subtitle: 'The bedtime routine', start: 'Start the routine',
      settings: 'Settings', back: 'Back', sounds: 'Sounds', introAnim: 'Opening animation',
      language: 'Language', defaults: 'Reset to defaults', defaultsConfirm: 'Reset all settings to defaults?',
      defaultsDone: 'Settings reset', needOneStep: 'At least one step must be active',
      total: 'Total time: {n} min', minUnit: 'min', pause: 'Pause', resume: 'Resume',
      prevStep: 'Previous step', nextStep: 'Next step', stop: 'Stop',
      stopConfirm: 'Stop the routine?', endTitle: 'Bedtime!', endMsg: 'Good night, sweet dreams ✨',
      finish: 'Done', sleep: 'Bedtime!', tapSkip: 'Tap to skip',
      p_pyjama: 'Pajamas', p_histoire: 'Story', p_biberon: 'Bottle', p_dents: 'Teeth', p_calin: 'Cuddle',
      myRitual: 'My routine', catHyg: 'Care & hygiene', catNight: 'Getting ready for night', catCalm: 'Quiet moments',
      support: 'Support the app',
      p_pot: 'Potty', p_couche: 'Diaper', p_bain: 'Bath', p_debarbouillage: 'Face wash',
      p_massage: 'Lotion / massage', p_medicament: 'Medicine', p_rangement: 'Tidy up toys',
      p_chambre: 'Prepare the room', p_veilleuse: 'Night light', p_doudou: 'Teddy & pacifier',
      p_eau: 'Glass of water', p_animal: 'Feed the pet', p_tetee: 'Nursing', p_berceuse: 'Lullaby',
      p_journee: 'Talk about the day', p_respiration: 'Calm breathing', p_priere: 'Prayer', p_bisous: 'Kisses for everyone',
      tabSteps: 'Steps', tabApp: 'App',
    } },
    zh: { name: '中文', dir: 'ltr', s: {
      appTitle: '睡觉啦！', subtitle: '睡前小仪式', start: '开始仪式',
      settings: '设置', back: '返回', sounds: '声音', introAnim: '开场动画',
      language: '语言', defaults: '恢复默认', defaultsConfirm: '要恢复默认设置吗？',
      defaultsDone: '已恢复默认设置', needOneStep: '至少要保留一个步骤',
      total: '总时长：{n} 分钟', minUnit: '分钟', pause: '暂停', resume: '继续',
      prevStep: '上一步', nextStep: '下一步', stop: '停止',
      stopConfirm: '要停止仪式吗？', endTitle: '睡觉啦！', endMsg: '晚安，做个好梦 ✨',
      finish: '完成', sleep: '睡觉啦！', tapSkip: '点击屏幕跳过',
      p_pyjama: '睡衣', p_histoire: '故事', p_biberon: '奶瓶', p_dents: '刷牙', p_calin: '抱抱',
      myRitual: '我的仪式', catHyg: '清洁护理', catNight: '准备睡觉', catCalm: '安静时光',
      support: '支持这个应用',
      p_pot: '坐便盆', p_couche: '换尿布', p_bain: '洗澡', p_debarbouillage: '洗脸',
      p_massage: '润肤按摩', p_medicament: '吃药', p_rangement: '收拾玩具',
      p_chambre: '准备房间', p_veilleuse: '小夜灯', p_doudou: '安抚物和奶嘴',
      p_eau: '喝点水', p_animal: '喂小动物', p_tetee: '喂奶', p_berceuse: '摇篮曲',
      p_journee: '聊聊今天', p_respiration: '深呼吸', p_priere: '祈祷', p_bisous: '亲亲大家',
      tabSteps: '步骤', tabApp: '应用',
    } },
    hi: { name: 'हिन्दी', dir: 'ltr', s: {
      appTitle: 'सोने का समय!', subtitle: 'सोने से पहले की रस्म', start: 'रस्म शुरू करें',
      settings: 'सेटिंग्स', back: 'वापस', sounds: 'आवाज़ें', introAnim: 'शुरुआती एनीमेशन',
      language: 'भाषा', defaults: 'डिफ़ॉल्ट सेटिंग्स', defaultsConfirm: 'सेटिंग्स डिफ़ॉल्ट पर वापस करें?',
      defaultsDone: 'सेटिंग्स रीसेट हो गईं', needOneStep: 'कम से कम एक चरण चालू होना चाहिए',
      total: 'कुल समय: {n} मिनट', minUnit: 'मिनट', pause: 'विराम', resume: 'जारी रखें',
      prevStep: 'पिछला चरण', nextStep: 'अगला चरण', stop: 'बंद करें',
      stopConfirm: 'रस्म बंद करें?', endTitle: 'सोने का समय!', endMsg: 'शुभ रात्रि, मीठे सपने ✨',
      finish: 'पूरा हुआ', sleep: 'सोने का समय!', tapSkip: 'छोड़ने के लिए स्क्रीन छुएँ',
      p_pyjama: 'पजामा', p_histoire: 'कहानी', p_biberon: 'दूध की बोतल', p_dents: 'दाँत', p_calin: 'झप्पी',
      myRitual: 'मेरी रस्म', catHyg: 'सफ़ाई और देखभाल', catNight: 'रात की तैयारी', catCalm: 'शांत पल',
      support: 'ऐप का समर्थन करें',
      p_pot: 'पॉटी', p_couche: 'डायपर', p_bain: 'नहाना', p_debarbouillage: 'मुँह धोना',
      p_massage: 'क्रीम / मालिश', p_medicament: 'दवा', p_rangement: 'खिलौने समेटना',
      p_chambre: 'कमरा तैयार करना', p_veilleuse: 'नाइट लैंप', p_doudou: 'खिलौना और चुसनी',
      p_eau: 'पानी का गिलास', p_animal: 'पालतू को खाना', p_tetee: 'स्तनपान', p_berceuse: 'लोरी',
      p_journee: 'दिन की बातें', p_respiration: 'शांत साँसें', p_priere: 'प्रार्थना', p_bisous: 'सबको पप्पी',
      tabSteps: 'चरण', tabApp: 'ऐप',
    } },
    es: { name: 'Español', dir: 'ltr', s: {
      appTitle: '¡A dormir!', subtitle: 'La rutina para ir a dormir', start: 'Empezar la rutina',
      settings: 'Ajustes', back: 'Volver', sounds: 'Sonidos', introAnim: 'Animación inicial',
      language: 'Idioma', defaults: 'Valores por defecto', defaultsConfirm: '¿Restablecer los ajustes?',
      defaultsDone: 'Ajustes restablecidos', needOneStep: 'Debe haber al menos una etapa activa',
      total: 'Duración total: {n} min', minUnit: 'min', pause: 'Pausa', resume: 'Reanudar',
      prevStep: 'Etapa anterior', nextStep: 'Etapa siguiente', stop: 'Detener',
      stopConfirm: '¿Detener la rutina?', endTitle: '¡A dormir!', endMsg: 'Buenas noches, dulces sueños ✨',
      finish: 'Terminar', sleep: '¡A dormir!', tapSkip: 'Toca la pantalla para saltar',
      p_pyjama: 'Pijama', p_histoire: 'Cuento', p_biberon: 'Biberón', p_dents: 'Dientes', p_calin: 'Mimos',
      myRitual: 'Mi rutina', catHyg: 'Higiene y cuidados', catNight: 'Preparar la noche', catCalm: 'Momentos de calma',
      support: 'Apoyar la app',
      p_pot: 'Orinal', p_couche: 'Pañal', p_bain: 'Baño', p_debarbouillage: 'Lavarse la cara',
      p_massage: 'Crema / masaje', p_medicament: 'Medicina', p_rangement: 'Recoger los juguetes',
      p_chambre: 'Preparar el cuarto', p_veilleuse: 'Luz de noche', p_doudou: 'Peluche y chupete',
      p_eau: 'Vaso de agua', p_animal: 'Dar de comer a la mascota', p_tetee: 'Lactancia', p_berceuse: 'Canción de cuna',
      p_journee: 'Contar el día', p_respiration: 'Respiración tranquila', p_priere: 'Oración', p_bisous: 'Besos para todos',
      tabSteps: 'Etapas', tabApp: 'App',
    } },
    ar: { name: 'العربية', dir: 'rtl', s: {
      appTitle: 'وقت النوم!', subtitle: 'روتين النوم', start: 'ابدأ الروتين',
      settings: 'الإعدادات', back: 'رجوع', sounds: 'الأصوات', introAnim: 'مقدمة متحركة',
      language: 'اللغة', defaults: 'استعادة الإعدادات الافتراضية', defaultsConfirm: 'هل تريد استعادة الإعدادات الافتراضية؟',
      defaultsDone: 'تمت استعادة الإعدادات', needOneStep: 'يجب أن تبقى خطوة واحدة مفعّلة على الأقل',
      total: 'المدة الكلية: {n} دقيقة', minUnit: 'دقيقة', pause: 'إيقاف مؤقت', resume: 'متابعة',
      prevStep: 'الخطوة السابقة', nextStep: 'الخطوة التالية', stop: 'إنهاء',
      stopConfirm: 'هل تريد إنهاء الروتين؟', endTitle: 'وقت النوم!', endMsg: 'تصبح على خير، أحلامًا سعيدة ✨',
      finish: 'تم', sleep: 'وقت النوم!', tapSkip: 'المس الشاشة للتخطي',
      p_pyjama: 'البيجاما', p_histoire: 'قصة', p_biberon: 'الرضّاعة', p_dents: 'الأسنان', p_calin: 'حضن',
      myRitual: 'روتيني', catHyg: 'النظافة والعناية', catNight: 'الاستعداد للنوم', catCalm: 'لحظات هادئة',
      support: 'ادعم التطبيق',
      p_pot: 'النونية', p_couche: 'الحفاض', p_bain: 'الاستحمام', p_debarbouillage: 'غسل الوجه',
      p_massage: 'كريم / تدليك', p_medicament: 'الدواء', p_rangement: 'ترتيب الألعاب',
      p_chambre: 'تجهيز الغرفة', p_veilleuse: 'ضوء الليل', p_doudou: 'الدبدوب واللهاية',
      p_eau: 'كوب ماء', p_animal: 'إطعام الحيوان', p_tetee: 'الرضاعة الطبيعية', p_berceuse: 'تهويدة',
      p_journee: 'حكاية اليوم', p_respiration: 'تنفس هادئ', p_priere: 'الدعاء', p_bisous: 'قبلات للجميع',
      tabSteps: 'الخطوات', tabApp: 'التطبيق',
    } },
    bn: { name: 'বাংলা', dir: 'ltr', s: {
      appTitle: 'ঘুমের সময়!', subtitle: 'ঘুমানোর আগের রুটিন', start: 'রুটিন শুরু করুন',
      settings: 'সেটিংস', back: 'ফিরে যান', sounds: 'শব্দ', introAnim: 'শুরুর অ্যানিমেশন',
      language: 'ভাষা', defaults: 'ডিফল্ট সেটিংস', defaultsConfirm: 'সেটিংস ডিফল্টে ফেরাবেন?',
      defaultsDone: 'সেটিংস রিসেট হয়েছে', needOneStep: 'অন্তত একটি ধাপ চালু থাকতে হবে',
      total: 'মোট সময়: {n} মিনিট', minUnit: 'মিনিট', pause: 'বিরতি', resume: 'চালিয়ে যান',
      prevStep: 'আগের ধাপ', nextStep: 'পরের ধাপ', stop: 'বন্ধ করুন',
      stopConfirm: 'রুটিন বন্ধ করবেন?', endTitle: 'ঘুমের সময়!', endMsg: 'শুভ রাত্রি, মিষ্টি স্বপ্ন ✨',
      finish: 'শেষ', sleep: 'ঘুমের সময়!', tapSkip: 'এড়িয়ে যেতে স্ক্রিনে চাপ দিন',
      p_pyjama: 'পায়জামা', p_histoire: 'গল্প', p_biberon: 'দুধের বোতল', p_dents: 'দাঁত', p_calin: 'আদর',
      myRitual: 'আমার রুটিন', catHyg: 'পরিচ্ছন্নতা ও যত্ন', catNight: 'রাতের প্রস্তুতি', catCalm: 'শান্ত মুহূর্ত',
      support: 'অ্যাপটিকে সহায়তা করুন',
      p_pot: 'পটি', p_couche: 'ডায়াপার', p_bain: 'গোসল', p_debarbouillage: 'মুখ ধোয়া',
      p_massage: 'ক্রিম / মালিশ', p_medicament: 'ওষুধ', p_rangement: 'খেলনা গোছানো',
      p_chambre: 'ঘর প্রস্তুত করা', p_veilleuse: 'রাতের আলো', p_doudou: 'পুতুল ও চুষি',
      p_eau: 'এক গ্লাস পানি', p_animal: 'পোষা প্রাণীকে খাওয়ানো', p_tetee: 'বুকের দুধ', p_berceuse: 'ঘুমপাড়ানি গান',
      p_journee: 'দিনের গল্প', p_respiration: 'শান্ত শ্বাস', p_priere: 'প্রার্থনা', p_bisous: 'সবাইকে চুমু',
      tabSteps: 'ধাপ', tabApp: 'অ্যাপ',
    } },
    pt: { name: 'Português', dir: 'ltr', s: {
      appTitle: 'Hora de dormir!', subtitle: 'A rotina de dormir', start: 'Começar a rotina',
      settings: 'Configurações', back: 'Voltar', sounds: 'Sons', introAnim: 'Animação inicial',
      language: 'Idioma', defaults: 'Restaurar padrões', defaultsConfirm: 'Restaurar as configurações padrão?',
      defaultsDone: 'Configurações restauradas', needOneStep: 'É preciso pelo menos uma etapa ativa',
      total: 'Duração total: {n} min', minUnit: 'min', pause: 'Pausa', resume: 'Retomar',
      prevStep: 'Etapa anterior', nextStep: 'Próxima etapa', stop: 'Parar',
      stopConfirm: 'Parar a rotina?', endTitle: 'Hora de dormir!', endMsg: 'Boa noite, bons sonhos ✨',
      finish: 'Concluir', sleep: 'Hora de dormir!', tapSkip: 'Toque na tela para pular',
      p_pyjama: 'Pijama', p_histoire: 'História', p_biberon: 'Mamadeira', p_dents: 'Dentes', p_calin: 'Carinho',
      myRitual: 'Minha rotina', catHyg: 'Higiene e cuidados', catNight: 'Preparar a noite', catCalm: 'Momentos de calma',
      support: 'Apoiar o app',
      p_pot: 'Peniquinho', p_couche: 'Fralda', p_bain: 'Banho', p_debarbouillage: 'Lavar o rosto',
      p_massage: 'Creme / massagem', p_medicament: 'Remédio', p_rangement: 'Guardar os brinquedos',
      p_chambre: 'Preparar o quarto', p_veilleuse: 'Luz noturna', p_doudou: 'Ursinho e chupeta',
      p_eau: 'Copo de água', p_animal: 'Alimentar o bichinho', p_tetee: 'Amamentação', p_berceuse: 'Canção de ninar',
      p_journee: 'Contar o dia', p_respiration: 'Respiração calma', p_priere: 'Oração', p_bisous: 'Beijos para todos',
      tabSteps: 'Etapas', tabApp: 'App',
    } },
    ru: { name: 'Русский', dir: 'ltr', s: {
      appTitle: 'Пора спать!', subtitle: 'Вечерний ритуал', start: 'Начать ритуал',
      settings: 'Настройки', back: 'Назад', sounds: 'Звуки', introAnim: 'Анимация в начале',
      language: 'Язык', defaults: 'Сбросить настройки', defaultsConfirm: 'Вернуть настройки по умолчанию?',
      defaultsDone: 'Настройки сброшены', needOneStep: 'Нужен хотя бы один активный этап',
      total: 'Общее время: {n} мин', minUnit: 'мин', pause: 'Пауза', resume: 'Продолжить',
      prevStep: 'Предыдущий этап', nextStep: 'Следующий этап', stop: 'Стоп',
      stopConfirm: 'Завершить ритуал?', endTitle: 'Пора спать!', endMsg: 'Спокойной ночи, сладких снов ✨',
      finish: 'Готово', sleep: 'Пора спать!', tapSkip: 'Коснитесь экрана, чтобы пропустить',
      p_pyjama: 'Пижама', p_histoire: 'Сказка', p_biberon: 'Бутылочка', p_dents: 'Зубки', p_calin: 'Обнимашки',
      myRitual: 'Мой ритуал', catHyg: 'Гигиена и уход', catNight: 'Подготовка ко сну', catCalm: 'Спокойные минуты',
      support: 'Поддержать приложение',
      p_pot: 'Горшок', p_couche: 'Подгузник', p_bain: 'Купание', p_debarbouillage: 'Умывание',
      p_massage: 'Крем / массаж', p_medicament: 'Лекарство', p_rangement: 'Убрать игрушки',
      p_chambre: 'Подготовить комнату', p_veilleuse: 'Ночник', p_doudou: 'Игрушка и соска',
      p_eau: 'Стакан воды', p_animal: 'Покормить питомца', p_tetee: 'Кормление грудью', p_berceuse: 'Колыбельная',
      p_journee: 'Рассказ о дне', p_respiration: 'Спокойное дыхание', p_priere: 'Молитва', p_bisous: 'Поцелуи всем',
      tabSteps: 'Этапы', tabApp: 'Приложение',
    } },
    ur: { name: 'اردو', dir: 'rtl', s: {
      appTitle: 'سونے کا وقت!', subtitle: 'سونے کا معمول', start: 'معمول شروع کریں',
      settings: 'ترتیبات', back: 'واپس', sounds: 'آوازیں', introAnim: 'شروع کی اینیمیشن',
      language: 'زبان', defaults: 'ڈیفالٹ ترتیبات', defaultsConfirm: 'ترتیبات ڈیفالٹ پر واپس کریں؟',
      defaultsDone: 'ترتیبات ری سیٹ ہو گئیں', needOneStep: 'کم از کم ایک مرحلہ فعال ہونا چاہیے',
      total: 'کل وقت: {n} منٹ', minUnit: 'منٹ', pause: 'وقفہ', resume: 'جاری رکھیں',
      prevStep: 'پچھلا مرحلہ', nextStep: 'اگلا مرحلہ', stop: 'بند کریں',
      stopConfirm: 'معمول بند کریں؟', endTitle: 'سونے کا وقت!', endMsg: 'شب بخیر، میٹھے خواب ✨',
      finish: 'مکمل', sleep: 'سونے کا وقت!', tapSkip: 'چھوڑنے کے لیے اسکرین چھوئیں',
      p_pyjama: 'پاجامہ', p_histoire: 'کہانی', p_biberon: 'فیڈر', p_dents: 'دانت', p_calin: 'پیار',
      myRitual: 'میرا معمول', catHyg: 'صفائی اور دیکھ بھال', catNight: 'رات کی تیاری', catCalm: 'پرسکون لمحے',
      support: 'ایپ کی مدد کریں',
      p_pot: 'پاٹی', p_couche: 'ڈائپر', p_bain: 'نہانا', p_debarbouillage: 'منہ دھونا',
      p_massage: 'کریم / مالش', p_medicament: 'دوا', p_rangement: 'کھلونے سمیٹنا',
      p_chambre: 'کمرہ تیار کرنا', p_veilleuse: 'رات کی بتی', p_doudou: 'کھلونا اور چوسنی',
      p_eau: 'پانی کا گلاس', p_animal: 'جانور کو کھانا دینا', p_tetee: 'دودھ پلانا', p_berceuse: 'لوری',
      p_journee: 'دن کی باتیں', p_respiration: 'پرسکون سانسیں', p_priere: 'دعا', p_bisous: 'سب کو پیار',
      tabSteps: 'مراحل', tabApp: 'ایپ',
    } },
    id: { name: 'Bahasa Indonesia', dir: 'ltr', s: {
      appTitle: 'Waktunya tidur!', subtitle: 'Rutinitas sebelum tidur', start: 'Mulai rutinitas',
      settings: 'Pengaturan', back: 'Kembali', sounds: 'Suara', introAnim: 'Animasi pembuka',
      language: 'Bahasa', defaults: 'Pengaturan awal', defaultsConfirm: 'Kembalikan pengaturan ke awal?',
      defaultsDone: 'Pengaturan dikembalikan', needOneStep: 'Minimal satu langkah harus aktif',
      total: 'Total waktu: {n} mnt', minUnit: 'mnt', pause: 'Jeda', resume: 'Lanjutkan',
      prevStep: 'Langkah sebelumnya', nextStep: 'Langkah berikutnya', stop: 'Berhenti',
      stopConfirm: 'Hentikan rutinitas?', endTitle: 'Waktunya tidur!', endMsg: 'Selamat tidur, mimpi indah ✨',
      finish: 'Selesai', sleep: 'Waktunya tidur!', tapSkip: 'Ketuk layar untuk melewati',
      p_pyjama: 'Piyama', p_histoire: 'Cerita', p_biberon: 'Botol susu', p_dents: 'Gigi', p_calin: 'Pelukan',
      myRitual: 'Rutinitasku', catHyg: 'Kebersihan & perawatan', catNight: 'Bersiap untuk malam', catCalm: 'Momen tenang',
      support: 'Dukung aplikasi ini',
      p_pot: 'Pispot', p_couche: 'Popok', p_bain: 'Mandi', p_debarbouillage: 'Cuci muka',
      p_massage: 'Krim / pijat', p_medicament: 'Obat', p_rangement: 'Membereskan mainan',
      p_chambre: 'Menyiapkan kamar', p_veilleuse: 'Lampu tidur', p_doudou: 'Boneka & empeng',
      p_eau: 'Segelas air', p_animal: 'Memberi makan hewan', p_tetee: 'Menyusui', p_berceuse: 'Nina bobo',
      p_journee: 'Cerita hari ini', p_respiration: 'Napas tenang', p_priere: 'Doa', p_bisous: 'Cium semua',
      tabSteps: 'Langkah', tabApp: 'Aplikasi',
    } },
    de: { name: 'Deutsch', dir: 'ltr', s: {
      appTitle: 'Schlafenszeit!', subtitle: 'Das Abendritual', start: 'Ritual starten',
      settings: 'Einstellungen', back: 'Zurück', sounds: 'Töne', introAnim: 'Startanimation',
      language: 'Sprache', defaults: 'Zurücksetzen', defaultsConfirm: 'Einstellungen zurücksetzen?',
      defaultsDone: 'Einstellungen zurückgesetzt', needOneStep: 'Mindestens ein Schritt muss aktiv sein',
      total: 'Gesamtdauer: {n} Min.', minUnit: 'Min.', pause: 'Pause', resume: 'Weiter',
      prevStep: 'Vorheriger Schritt', nextStep: 'Nächster Schritt', stop: 'Beenden',
      stopConfirm: 'Ritual beenden?', endTitle: 'Schlafenszeit!', endMsg: 'Gute Nacht, träum süß ✨',
      finish: 'Fertig', sleep: 'Schlafenszeit!', tapSkip: 'Zum Überspringen tippen',
      p_pyjama: 'Schlafanzug', p_histoire: 'Geschichte', p_biberon: 'Fläschchen', p_dents: 'Zähne', p_calin: 'Kuscheln',
      myRitual: 'Mein Ritual', catHyg: 'Pflege & Hygiene', catNight: 'Die Nacht vorbereiten', catCalm: 'Ruhige Momente',
      support: 'App unterstützen',
      p_pot: 'Töpfchen', p_couche: 'Windel', p_bain: 'Baden', p_debarbouillage: 'Gesicht waschen',
      p_massage: 'Creme / Massage', p_medicament: 'Medizin', p_rangement: 'Spielzeug aufräumen',
      p_chambre: 'Zimmer vorbereiten', p_veilleuse: 'Nachtlicht', p_doudou: 'Kuscheltier & Schnuller',
      p_eau: 'Glas Wasser', p_animal: 'Haustier füttern', p_tetee: 'Stillen', p_berceuse: 'Schlaflied',
      p_journee: 'Vom Tag erzählen', p_respiration: 'Ruhiges Atmen', p_priere: 'Gebet', p_bisous: 'Küsschen für alle',
      tabSteps: 'Schritte', tabApp: 'App',
    } },
    ja: { name: '日本語', dir: 'ltr', s: {
      appTitle: 'ねんねの時間！', subtitle: 'おやすみ前のルーティン', start: 'ルーティンをはじめる',
      settings: '設定', back: '戻る', sounds: 'サウンド', introAnim: 'オープニングアニメ',
      language: '言語', defaults: '初期設定に戻す', defaultsConfirm: '設定を初期状態に戻しますか？',
      defaultsDone: '設定をリセットしました', needOneStep: '少なくとも1つのステップが必要です',
      total: '合計時間：{n} 分', minUnit: '分', pause: '一時停止', resume: '再開',
      prevStep: '前のステップ', nextStep: '次のステップ', stop: '終了',
      stopConfirm: 'ルーティンを終了しますか？', endTitle: 'ねんねの時間！', endMsg: 'おやすみなさい、いい夢を ✨',
      finish: '完了', sleep: 'ねんね！', tapSkip: '画面をタップでスキップ',
      p_pyjama: 'パジャマ', p_histoire: 'えほん', p_biberon: 'ミルク', p_dents: 'はみがき', p_calin: 'ぎゅー',
      myRitual: 'わたしのルーティン', catHyg: 'せいけつ・ケア', catNight: 'ねるじゅんび', catCalm: 'しずかな時間',
      support: 'アプリを応援する',
      p_pot: 'おまる', p_couche: 'おむつ', p_bain: 'おふろ', p_debarbouillage: '顔を洗う',
      p_massage: 'クリーム・マッサージ', p_medicament: 'おくすり', p_rangement: 'おもちゃのおかたづけ',
      p_chambre: 'お部屋のじゅんび', p_veilleuse: 'ナイトライト', p_doudou: 'ぬいぐるみとおしゃぶり',
      p_eau: 'お水をひとくち', p_animal: 'ペットのごはん', p_tetee: '授乳', p_berceuse: '子守唄',
      p_journee: '今日のおはなし', p_respiration: 'しずかな呼吸', p_priere: 'お祈り', p_bisous: 'みんなにチュー',
      tabSteps: 'ステップ', tabApp: 'アプリ',
    } },
    sw: { name: 'Kiswahili', dir: 'ltr', s: {
      appTitle: 'Wakati wa kulala!', subtitle: 'Utaratibu wa kulala', start: 'Anza utaratibu',
      settings: 'Mipangilio', back: 'Rudi', sounds: 'Sauti', introAnim: 'Uhuishaji wa mwanzo',
      language: 'Lugha', defaults: 'Rejesha chaguo-msingi', defaultsConfirm: 'Urejeshe mipangilio ya awali?',
      defaultsDone: 'Mipangilio imerejeshwa', needOneStep: 'Lazima angalau hatua moja iwe imewashwa',
      total: 'Muda wote: {n} dak', minUnit: 'dak', pause: 'Sitisha', resume: 'Endelea',
      prevStep: 'Hatua iliyopita', nextStep: 'Hatua inayofuata', stop: 'Simamisha',
      stopConfirm: 'Usimamishe utaratibu?', endTitle: 'Wakati wa kulala!', endMsg: 'Usiku mwema, ndoto njema ✨',
      finish: 'Maliza', sleep: 'Wakati wa kulala!', tapSkip: 'Gusa skrini kuruka',
      p_pyjama: 'Pajama', p_histoire: 'Hadithi', p_biberon: 'Chupa ya maziwa', p_dents: 'Meno', p_calin: 'Kumbatio',
      myRitual: 'Utaratibu wangu', catHyg: 'Usafi na utunzaji', catNight: 'Kujiandaa kwa usiku', catCalm: 'Nyakati za utulivu',
      support: 'Unga mkono programu',
      p_pot: 'Choo cha mtoto', p_couche: 'Nepi', p_bain: 'Kuoga', p_debarbouillage: 'Kunawa uso',
      p_massage: 'Krimu / masaji', p_medicament: 'Dawa', p_rangement: 'Kupanga vinyago',
      p_chambre: 'Kuandaa chumba', p_veilleuse: 'Taa ya usiku', p_doudou: 'Mdoli na chuchu',
      p_eau: 'Glasi ya maji', p_animal: 'Kulisha mnyama', p_tetee: 'Kunyonyesha', p_berceuse: 'Wimbo wa kulala',
      p_journee: 'Hadithi ya siku', p_respiration: 'Kupumua kwa utulivu', p_priere: 'Sala', p_bisous: 'Busu kwa wote',
      tabSteps: 'Hatua', tabApp: 'Programu',
    } },
    mr: { name: 'मराठी', dir: 'ltr', s: {
      appTitle: 'झोपेची वेळ!', subtitle: 'झोपण्यापूर्वीची दिनचर्या', start: 'दिनचर्या सुरू करा',
      settings: 'सेटिंग्ज', back: 'मागे', sounds: 'आवाज', introAnim: 'सुरुवातीचे अ‍ॅनिमेशन',
      language: 'भाषा', defaults: 'डीफॉल्ट सेटिंग्ज', defaultsConfirm: 'सेटिंग्ज डीफॉल्टवर परत आणायच्या?',
      defaultsDone: 'सेटिंग्ज रीसेट झाल्या', needOneStep: 'किमान एक टप्पा सुरू असावा',
      total: 'एकूण वेळ: {n} मिनिटे', minUnit: 'मिनिटे', pause: 'विराम', resume: 'पुढे चालू ठेवा',
      prevStep: 'मागील टप्पा', nextStep: 'पुढील टप्पा', stop: 'थांबवा',
      stopConfirm: 'दिनचर्या थांबवायची?', endTitle: 'झोपेची वेळ!', endMsg: 'शुभ रात्री, गोड स्वप्ने ✨',
      finish: 'झाले', sleep: 'झोपेची वेळ!', tapSkip: 'वगळण्यासाठी स्क्रीनला स्पर्श करा',
      p_pyjama: 'पायजमा', p_histoire: 'गोष्ट', p_biberon: 'दुधाची बाटली', p_dents: 'दात', p_calin: 'मिठी',
      myRitual: 'माझी दिनचर्या', catHyg: 'स्वच्छता आणि काळजी', catNight: 'रात्रीची तयारी', catCalm: 'शांत क्षण',
      support: 'अ‍ॅपला पाठिंबा द्या',
      p_pot: 'पॉटी', p_couche: 'डायपर', p_bain: 'आंघोळ', p_debarbouillage: 'तोंड धुणे',
      p_massage: 'क्रीम / मालिश', p_medicament: 'औषध', p_rangement: 'खेळणी आवरणे',
      p_chambre: 'खोली तयार करणे', p_veilleuse: 'रात्रीचा दिवा', p_doudou: 'बाहुली आणि चोखणी',
      p_eau: 'पाण्याचा ग्लास', p_animal: 'पाळीव प्राण्याला खाऊ', p_tetee: 'स्तनपान', p_berceuse: 'अंगाई',
      p_journee: 'दिवसाच्या गप्पा', p_respiration: 'शांत श्वास', p_priere: 'प्रार्थना', p_bisous: 'सर्वांना पापी',
      tabSteps: 'टप्पे', tabApp: 'अ‍ॅप',
    } },
    te: { name: 'తెలుగు', dir: 'ltr', s: {
      appTitle: 'నిద్ర వేళ!', subtitle: 'నిద్రకు ముందు దినచర్య', start: 'దినచర్య ప్రారంభించండి',
      settings: 'సెట్టింగ్‌లు', back: 'వెనుకకు', sounds: 'శబ్దాలు', introAnim: 'ప్రారంభ యానిమేషన్',
      language: 'భాష', defaults: 'డిఫాల్ట్ సెట్టింగ్‌లు', defaultsConfirm: 'సెట్టింగ్‌లను డిఫాల్ట్‌కు మార్చాలా?',
      defaultsDone: 'సెట్టింగ్‌లు రీసెట్ అయ్యాయి', needOneStep: 'కనీసం ఒక దశ యాక్టివ్‌గా ఉండాలి',
      total: 'మొత్తం సమయం: {n} నిమి.', minUnit: 'నిమి.', pause: 'విరామం', resume: 'కొనసాగించండి',
      prevStep: 'మునుపటి దశ', nextStep: 'తర్వాతి దశ', stop: 'ఆపండి',
      stopConfirm: 'దినచర్యను ఆపాలా?', endTitle: 'నిద్ర వేళ!', endMsg: 'శుభరాత్రి, తీపి కలలు ✨',
      finish: 'అయిపోయింది', sleep: 'నిద్ర వేళ!', tapSkip: 'దాటవేయడానికి స్క్రీన్‌ను తాకండి',
      p_pyjama: 'పైజామా', p_histoire: 'కథ', p_biberon: 'పాల సీసా', p_dents: 'పళ్ళు', p_calin: 'కౌగిలి',
      myRitual: 'నా దినచర్య', catHyg: 'శుభ్రత & సంరక్షణ', catNight: 'రాత్రికి సిద్ధం', catCalm: 'ప్రశాంత క్షణాలు',
      support: 'యాప్‌కు మద్దతు ఇవ్వండి',
      p_pot: 'పాటీ', p_couche: 'డైపర్', p_bain: 'స్నానం', p_debarbouillage: 'ముఖం కడుక్కోవడం',
      p_massage: 'క్రీమ్ / మసాజ్', p_medicament: 'మందు', p_rangement: 'బొమ్మలు సర్దడం',
      p_chambre: 'గది సిద్ధం చేయడం', p_veilleuse: 'రాత్రి దీపం', p_doudou: 'బొమ్మ & పీక',
      p_eau: 'గ్లాసు నీళ్ళు', p_animal: 'పెంపుడు జంతువుకు ఆహారం', p_tetee: 'పాలివ్వడం', p_berceuse: 'జోల పాట',
      p_journee: 'రోజు కబుర్లు', p_respiration: 'ప్రశాంత శ్వాస', p_priere: 'ప్రార్థన', p_bisous: 'అందరికీ ముద్దులు',
      tabSteps: 'దశలు', tabApp: 'యాప్',
    } },
    tr: { name: 'Türkçe', dir: 'ltr', s: {
      appTitle: 'Uyku vakti!', subtitle: 'Uyku öncesi rutini', start: 'Rutini başlat',
      settings: 'Ayarlar', back: 'Geri', sounds: 'Sesler', introAnim: 'Açılış animasyonu',
      language: 'Dil', defaults: 'Varsayılanlara dön', defaultsConfirm: 'Ayarlar varsayılana dönsün mü?',
      defaultsDone: 'Ayarlar sıfırlandı', needOneStep: 'En az bir adım etkin olmalı',
      total: 'Toplam süre: {n} dk', minUnit: 'dk', pause: 'Duraklat', resume: 'Devam et',
      prevStep: 'Önceki adım', nextStep: 'Sonraki adım', stop: 'Bitir',
      stopConfirm: 'Rutin bitirilsin mi?', endTitle: 'Uyku vakti!', endMsg: 'İyi geceler, tatlı rüyalar ✨',
      finish: 'Bitti', sleep: 'Uyku vakti!', tapSkip: 'Atlamak için ekrana dokun',
      p_pyjama: 'Pijama', p_histoire: 'Masal', p_biberon: 'Biberon', p_dents: 'Dişler', p_calin: 'Sarılma',
      myRitual: 'Benim ritüelim', catHyg: 'Temizlik ve bakım', catNight: 'Geceye hazırlık', catCalm: 'Sakin anlar',
      support: 'Uygulamayı destekle',
      p_pot: 'Lazımlık', p_couche: 'Bez', p_bain: 'Banyo', p_debarbouillage: 'Yüz yıkama',
      p_massage: 'Krem / masaj', p_medicament: 'İlaç', p_rangement: 'Oyuncakları toplama',
      p_chambre: 'Odayı hazırlama', p_veilleuse: 'Gece lambası', p_doudou: 'Oyuncak ve emzik',
      p_eau: 'Bir bardak su', p_animal: 'Evcil hayvanı besleme', p_tetee: 'Emzirme', p_berceuse: 'Ninni',
      p_journee: 'Günü anlatma', p_respiration: 'Sakin nefes', p_priere: 'Dua', p_bisous: 'Herkese öpücük',
      tabSteps: 'Adımlar', tabApp: 'Uygulama',
    } },
    ta: { name: 'தமிழ்', dir: 'ltr', s: {
      appTitle: 'தூங்கும் நேரம்!', subtitle: 'தூக்கத்திற்கு முந்தைய வழக்கம்', start: 'வழக்கத்தைத் தொடங்கு',
      settings: 'அமைப்புகள்', back: 'பின்செல்', sounds: 'ஒலிகள்', introAnim: 'தொடக்க அனிமேஷன்',
      language: 'மொழி', defaults: 'இயல்புநிலை அமைப்புகள்', defaultsConfirm: 'அமைப்புகளை இயல்புநிலைக்கு மாற்றவா?',
      defaultsDone: 'அமைப்புகள் மீட்டமைக்கப்பட்டன', needOneStep: 'குறைந்தது ஒரு படி இயக்கத்தில் இருக்க வேண்டும்',
      total: 'மொத்த நேரம்: {n} நிமி.', minUnit: 'நிமி.', pause: 'இடைநிறுத்து', resume: 'தொடரு',
      prevStep: 'முந்தைய படி', nextStep: 'அடுத்த படி', stop: 'நிறுத்து',
      stopConfirm: 'வழக்கத்தை நிறுத்தவா?', endTitle: 'தூங்கும் நேரம்!', endMsg: 'இனிய இரவு, இனிய கனவுகள் ✨',
      finish: 'முடிந்தது', sleep: 'தூங்கும் நேரம்!', tapSkip: 'தவிர்க்க திரையைத் தொடவும்',
      p_pyjama: 'பைஜாமா', p_histoire: 'கதை', p_biberon: 'பால் புட்டி', p_dents: 'பற்கள்', p_calin: 'அணைப்பு',
      myRitual: 'என் வழக்கம்', catHyg: 'சுத்தம் & பராமரிப்பு', catNight: 'இரவுக்குத் தயாராதல்', catCalm: 'அமைதியான நேரம்',
      support: 'ஆப்பை ஆதரிக்கவும்',
      p_pot: 'குழந்தை கழிப்பறை', p_couche: 'டயப்பர்', p_bain: 'குளியல்', p_debarbouillage: 'முகம் கழுவுதல்',
      p_massage: 'கிரீம் / மசாஜ்', p_medicament: 'மருந்து', p_rangement: 'பொம்மைகளை அடுக்குதல்',
      p_chambre: 'அறையைத் தயார் செய்தல்', p_veilleuse: 'இரவு விளக்கு', p_doudou: 'பொம்மை & சூப்பி',
      p_eau: 'ஒரு டம்ளர் தண்ணீர்', p_animal: 'செல்லப்பிராணிக்கு உணவு', p_tetee: 'தாய்ப்பால்', p_berceuse: 'தாலாட்டு',
      p_journee: 'இன்றைய கதை', p_respiration: 'அமைதியான மூச்சு', p_priere: 'பிரார்த்தனை', p_bisous: 'எல்லோருக்கும் முத்தம்',
      tabSteps: 'படிகள்', tabApp: 'செயலி',
    } },
    vi: { name: 'Tiếng Việt', dir: 'ltr', s: {
      appTitle: 'Đến giờ đi ngủ!', subtitle: 'Thói quen trước khi ngủ', start: 'Bắt đầu thói quen',
      settings: 'Cài đặt', back: 'Quay lại', sounds: 'Âm thanh', introAnim: 'Hoạt ảnh mở đầu',
      language: 'Ngôn ngữ', defaults: 'Khôi phục mặc định', defaultsConfirm: 'Khôi phục cài đặt mặc định?',
      defaultsDone: 'Đã khôi phục cài đặt', needOneStep: 'Phải có ít nhất một bước được bật',
      total: 'Tổng thời gian: {n} phút', minUnit: 'phút', pause: 'Tạm dừng', resume: 'Tiếp tục',
      prevStep: 'Bước trước', nextStep: 'Bước tiếp theo', stop: 'Dừng',
      stopConfirm: 'Dừng thói quen?', endTitle: 'Đến giờ đi ngủ!', endMsg: 'Chúc bé ngủ ngon, mơ đẹp ✨',
      finish: 'Xong', sleep: 'Đi ngủ thôi!', tapSkip: 'Chạm màn hình để bỏ qua',
      p_pyjama: 'Đồ ngủ', p_histoire: 'Truyện', p_biberon: 'Bình sữa', p_dents: 'Đánh răng', p_calin: 'Ôm',
      myRitual: 'Nghi thức của bé', catHyg: 'Vệ sinh & chăm sóc', catNight: 'Chuẩn bị đi ngủ', catCalm: 'Khoảnh khắc yên bình',
      support: 'Ủng hộ ứng dụng',
      p_pot: 'Ngồi bô', p_couche: 'Thay tã', p_bain: 'Tắm', p_debarbouillage: 'Rửa mặt',
      p_massage: 'Kem / mát-xa', p_medicament: 'Uống thuốc', p_rangement: 'Dọn đồ chơi',
      p_chambre: 'Chuẩn bị phòng', p_veilleuse: 'Đèn ngủ', p_doudou: 'Gấu bông & ti giả',
      p_eau: 'Cốc nước', p_animal: 'Cho thú cưng ăn', p_tetee: 'Bú mẹ', p_berceuse: 'Hát ru',
      p_journee: 'Kể chuyện trong ngày', p_respiration: 'Hít thở nhẹ nhàng', p_priere: 'Cầu nguyện', p_bisous: 'Hôn cả nhà',
      tabSteps: 'Các bước', tabApp: 'Ứng dụng',
    } },
    ko: { name: '한국어', dir: 'ltr', s: {
      appTitle: '잘 시간이야!', subtitle: '잠자기 전 루틴', start: '루틴 시작',
      settings: '설정', back: '뒤로', sounds: '소리', introAnim: '시작 애니메이션',
      language: '언어', defaults: '기본값으로 재설정', defaultsConfirm: '설정을 기본값으로 되돌릴까요?',
      defaultsDone: '설정이 초기화되었습니다', needOneStep: '최소 한 단계는 켜져 있어야 해요',
      total: '총 시간: {n}분', minUnit: '분', pause: '일시정지', resume: '계속',
      prevStep: '이전 단계', nextStep: '다음 단계', stop: '종료',
      stopConfirm: '루틴을 종료할까요?', endTitle: '잘 시간이야!', endMsg: '잘 자, 좋은 꿈 꿔 ✨',
      finish: '완료', sleep: '코 자자!', tapSkip: '화면을 누르면 건너뛰어요',
      p_pyjama: '잠옷', p_histoire: '동화', p_biberon: '젖병', p_dents: '양치', p_calin: '안아주기',
      myRitual: '나의 루틴', catHyg: '청결과 돌봄', catNight: '잠잘 준비', catCalm: '조용한 시간',
      support: '앱 응원하기',
      p_pot: '아기 변기', p_couche: '기저귀', p_bain: '목욕', p_debarbouillage: '세수',
      p_massage: '로션 / 마사지', p_medicament: '약 먹기', p_rangement: '장난감 정리',
      p_chambre: '방 준비하기', p_veilleuse: '수면등', p_doudou: '인형과 쪽쪽이',
      p_eau: '물 한 잔', p_animal: '반려동물 밥 주기', p_tetee: '수유', p_berceuse: '자장가',
      p_journee: '오늘 이야기', p_respiration: '차분한 숨쉬기', p_priere: '기도', p_bisous: '모두에게 뽀뽀',
      tabSteps: '단계', tabApp: '앱',
    } },
    tl: { name: 'Filipino', dir: 'ltr', s: {
      appTitle: 'Tulog na!', subtitle: 'Rutina bago matulog', start: 'Simulan ang rutina',
      settings: 'Mga setting', back: 'Bumalik', sounds: 'Mga tunog', introAnim: 'Panimulang animation',
      language: 'Wika', defaults: 'Ibalik sa default', defaultsConfirm: 'Ibalik ang mga setting sa default?',
      defaultsDone: 'Na-reset ang mga setting', needOneStep: 'Kailangan ng kahit isang aktibong hakbang',
      total: 'Kabuuang oras: {n} min', minUnit: 'min', pause: 'I-pause', resume: 'Ituloy',
      prevStep: 'Nakaraang hakbang', nextStep: 'Susunod na hakbang', stop: 'Itigil',
      stopConfirm: 'Itigil ang rutina?', endTitle: 'Tulog na!', endMsg: 'Magandang gabi, matamis na panaginip ✨',
      finish: 'Tapos na', sleep: 'Tulog na!', tapSkip: 'I-tap ang screen para laktawan',
      p_pyjama: 'Pajama', p_histoire: 'Kuwento', p_biberon: 'Bote ng gatas', p_dents: 'Ngipin', p_calin: 'Yakap',
      myRitual: 'Ang routine ko', catHyg: 'Kalinisan at pag-aalaga', catNight: 'Paghahanda sa gabi', catCalm: 'Tahimik na sandali',
      support: 'Suportahan ang app',
      p_pot: 'Arinola', p_couche: 'Lampin', p_bain: 'Paliligo', p_debarbouillage: 'Paghilamos',
      p_massage: 'Cream / masahe', p_medicament: 'Gamot', p_rangement: 'Pag-iimis ng laruan',
      p_chambre: 'Paghahanda ng kwarto', p_veilleuse: 'Ilaw pangtulog', p_doudou: 'Teddy at chupon',
      p_eau: 'Baso ng tubig', p_animal: 'Pagpapakain sa alaga', p_tetee: 'Pagpapasuso', p_berceuse: 'Oyayi',
      p_journee: 'Kwento ng araw', p_respiration: 'Mahinahong paghinga', p_priere: 'Dasal', p_bisous: 'Halik sa lahat',
      tabSteps: 'Mga hakbang', tabApp: 'App',
    } },
    fa: { name: 'فارسی', dir: 'rtl', s: {
      appTitle: 'وقت خوابه!', subtitle: 'روتین قبل از خواب', start: 'شروع روتین',
      settings: 'تنظیمات', back: 'بازگشت', sounds: 'صداها', introAnim: 'انیمیشن شروع',
      language: 'زبان', defaults: 'بازگردانی به پیش‌فرض', defaultsConfirm: 'تنظیمات به پیش‌فرض برگردد؟',
      defaultsDone: 'تنظیمات بازنشانی شد', needOneStep: 'حداقل یک مرحله باید فعال باشد',
      total: 'مدت کل: {n} دقیقه', minUnit: 'دقیقه', pause: 'توقف موقت', resume: 'ادامه',
      prevStep: 'مرحله قبلی', nextStep: 'مرحله بعدی', stop: 'پایان',
      stopConfirm: 'روتین تمام شود؟', endTitle: 'وقت خوابه!', endMsg: 'شب بخیر، خواب‌های شیرین ✨',
      finish: 'تمام', sleep: 'وقت خوابه!', tapSkip: 'برای رد شدن صفحه را لمس کنید',
      p_pyjama: 'پیژامه', p_histoire: 'قصه', p_biberon: 'شیشه شیر', p_dents: 'دندان‌ها', p_calin: 'بغل',
      myRitual: 'روتین من', catHyg: 'بهداشت و مراقبت', catNight: 'آماده شدن برای شب', catCalm: 'لحظه‌های آرام',
      support: 'حمایت از برنامه',
      p_pot: 'توالت کودک', p_couche: 'پوشک', p_bain: 'حمام', p_debarbouillage: 'شستن صورت',
      p_massage: 'کرم / ماساژ', p_medicament: 'دارو', p_rangement: 'جمع کردن اسباب‌بازی‌ها',
      p_chambre: 'آماده کردن اتاق', p_veilleuse: 'چراغ خواب', p_doudou: 'عروسک و پستانک',
      p_eau: 'یک لیوان آب', p_animal: 'غذا دادن به حیوان خانگی', p_tetee: 'شیر مادر', p_berceuse: 'لالایی',
      p_journee: 'تعریف روز', p_respiration: 'نفس آرام', p_priere: 'دعا', p_bisous: 'بوس برای همه',
      tabSteps: 'مراحل', tabApp: 'برنامه',
    } },
    it: { name: 'Italiano', dir: 'ltr', s: {
      appTitle: 'A nanna!', subtitle: 'La routine della nanna', start: 'Inizia la routine',
      settings: 'Impostazioni', back: 'Indietro', sounds: 'Suoni', introAnim: 'Animazione iniziale',
      language: 'Lingua', defaults: 'Ripristina predefiniti', defaultsConfirm: 'Ripristinare le impostazioni predefinite?',
      defaultsDone: 'Impostazioni ripristinate', needOneStep: 'Almeno una tappa deve essere attiva',
      total: 'Durata totale: {n} min', minUnit: 'min', pause: 'Pausa', resume: 'Riprendi',
      prevStep: 'Tappa precedente', nextStep: 'Tappa successiva', stop: 'Termina',
      stopConfirm: 'Terminare la routine?', endTitle: 'A nanna!', endMsg: 'Buonanotte, sogni d\'oro ✨',
      finish: 'Fine', sleep: 'A nanna!', tapSkip: 'Tocca lo schermo per saltare',
      p_pyjama: 'Pigiama', p_histoire: 'Favola', p_biberon: 'Biberon', p_dents: 'Dentini', p_calin: 'Coccole',
      myRitual: 'Il mio rituale', catHyg: 'Igiene e cura', catNight: 'Prepararsi alla notte', catCalm: 'Momenti di calma',
      support: "Sostieni l'app",
      p_pot: 'Vasino', p_couche: 'Pannolino', p_bain: 'Bagnetto', p_debarbouillage: 'Lavare il viso',
      p_massage: 'Crema / massaggio', p_medicament: 'Medicina', p_rangement: 'Riordinare i giochi',
      p_chambre: 'Preparare la cameretta', p_veilleuse: 'Lucina notturna', p_doudou: 'Peluche e ciuccio',
      p_eau: "Bicchiere d'acqua", p_animal: "Dare da mangiare all'animale", p_tetee: 'Allattamento', p_berceuse: 'Ninna nanna',
      p_journee: 'Raccontare la giornata', p_respiration: 'Respiro calmo', p_priere: 'Preghiera', p_bisous: 'Baci a tutti',
      tabSteps: 'Tappe', tabApp: 'App',
    } },
    th: { name: 'ไทย', dir: 'ltr', s: {
      appTitle: 'ได้เวลานอนแล้ว!', subtitle: 'กิจวัตรก่อนนอน', start: 'เริ่มกิจวัตร',
      settings: 'การตั้งค่า', back: 'กลับ', sounds: 'เสียง', introAnim: 'แอนิเมชันเปิด',
      language: 'ภาษา', defaults: 'คืนค่าเริ่มต้น', defaultsConfirm: 'คืนการตั้งค่าเป็นค่าเริ่มต้น?',
      defaultsDone: 'รีเซ็ตการตั้งค่าแล้ว', needOneStep: 'ต้องเปิดอย่างน้อยหนึ่งขั้นตอน',
      total: 'เวลารวม: {n} นาที', minUnit: 'นาที', pause: 'หยุดชั่วคราว', resume: 'ทำต่อ',
      prevStep: 'ขั้นตอนก่อนหน้า', nextStep: 'ขั้นตอนถัดไป', stop: 'หยุด',
      stopConfirm: 'หยุดกิจวัตรไหม?', endTitle: 'ได้เวลานอนแล้ว!', endMsg: 'ฝันดีนะ หลับฝันหวาน ✨',
      finish: 'เสร็จแล้ว', sleep: 'นอนกันเถอะ!', tapSkip: 'แตะหน้าจอเพื่อข้าม',
      p_pyjama: 'ชุดนอน', p_histoire: 'นิทาน', p_biberon: 'ขวดนม', p_dents: 'แปรงฟัน', p_calin: 'กอด',
      myRitual: 'กิจวัตรของฉัน', catHyg: 'ความสะอาดและการดูแล', catNight: 'เตรียมตัวเข้านอน', catCalm: 'ช่วงเวลาสงบ',
      support: 'สนับสนุนแอป',
      p_pot: 'กระโถน', p_couche: 'ผ้าอ้อม', p_bain: 'อาบน้ำ', p_debarbouillage: 'ล้างหน้า',
      p_massage: 'ครีม / นวด', p_medicament: 'กินยา', p_rangement: 'เก็บของเล่น',
      p_chambre: 'จัดห้องนอน', p_veilleuse: 'ไฟกลางคืน', p_doudou: 'ตุ๊กตาและจุกนม',
      p_eau: 'น้ำหนึ่งแก้ว', p_animal: 'ให้อาหารสัตว์เลี้ยง', p_tetee: 'ให้นมแม่', p_berceuse: 'เพลงกล่อม',
      p_journee: 'เล่าเรื่องวันนี้', p_respiration: 'หายใจช้า ๆ', p_priere: 'สวดมนต์', p_bisous: 'หอมแก้มทุกคน',
      tabSteps: 'ขั้นตอน', tabApp: 'แอป',
    } },
    pa: { name: 'ਪੰਜਾਬੀ', dir: 'ltr', s: {
      appTitle: 'ਸੌਣ ਦਾ ਵੇਲਾ!', subtitle: 'ਸੌਣ ਤੋਂ ਪਹਿਲਾਂ ਦੀ ਰੁਟੀਨ', start: 'ਰੁਟੀਨ ਸ਼ੁਰੂ ਕਰੋ',
      settings: 'ਸੈਟਿੰਗਾਂ', back: 'ਵਾਪਸ', sounds: 'ਆਵਾਜ਼ਾਂ', introAnim: 'ਸ਼ੁਰੂਆਤੀ ਐਨੀਮੇਸ਼ਨ',
      language: 'ਭਾਸ਼ਾ', defaults: 'ਡਿਫਾਲਟ ਸੈਟਿੰਗਾਂ', defaultsConfirm: 'ਸੈਟਿੰਗਾਂ ਡਿਫਾਲਟ ਤੇ ਵਾਪਸ ਕਰੀਏ?',
      defaultsDone: 'ਸੈਟਿੰਗਾਂ ਰੀਸੈੱਟ ਹੋ ਗਈਆਂ', needOneStep: 'ਘੱਟੋ-ਘੱਟ ਇੱਕ ਕਦਮ ਚਾਲੂ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ',
      total: 'ਕੁੱਲ ਸਮਾਂ: {n} ਮਿੰਟ', minUnit: 'ਮਿੰਟ', pause: 'ਠਹਿਰਾਓ', resume: 'ਜਾਰੀ ਰੱਖੋ',
      prevStep: 'ਪਿਛਲਾ ਕਦਮ', nextStep: 'ਅਗਲਾ ਕਦਮ', stop: 'ਬੰਦ ਕਰੋ',
      stopConfirm: 'ਰੁਟੀਨ ਬੰਦ ਕਰੀਏ?', endTitle: 'ਸੌਣ ਦਾ ਵੇਲਾ!', endMsg: 'ਸ਼ੁਭ ਰਾਤ, ਮਿੱਠੇ ਸੁਪਨੇ ✨',
      finish: 'ਹੋ ਗਿਆ', sleep: 'ਸੌਣ ਦਾ ਵੇਲਾ!', tapSkip: 'ਛੱਡਣ ਲਈ ਸਕ੍ਰੀਨ ਛੂਹੋ',
      p_pyjama: 'ਪਜਾਮਾ', p_histoire: 'ਕਹਾਣੀ', p_biberon: 'ਦੁੱਧ ਦੀ ਬੋਤਲ', p_dents: 'ਦੰਦ', p_calin: 'ਜੱਫੀ',
      myRitual: 'ਮੇਰੀ ਰੁਟੀਨ', catHyg: 'ਸਫ਼ਾਈ ਤੇ ਦੇਖਭਾਲ', catNight: 'ਰਾਤ ਦੀ ਤਿਆਰੀ', catCalm: 'ਸ਼ਾਂਤ ਪਲ',
      support: 'ਐਪ ਦੀ ਮਦਦ ਕਰੋ',
      p_pot: 'ਪਾਟੀ', p_couche: 'ਡਾਇਪਰ', p_bain: 'ਨਹਾਉਣਾ', p_debarbouillage: 'ਮੂੰਹ ਧੋਣਾ',
      p_massage: 'ਕਰੀਮ / ਮਾਲਸ਼', p_medicament: 'ਦਵਾਈ', p_rangement: 'ਖਿਡੌਣੇ ਸਮੇਟਣਾ',
      p_chambre: 'ਕਮਰਾ ਤਿਆਰ ਕਰਨਾ', p_veilleuse: 'ਰਾਤ ਦੀ ਬੱਤੀ', p_doudou: 'ਖਿਡੌਣਾ ਤੇ ਚੁਸਨੀ',
      p_eau: 'ਪਾਣੀ ਦਾ ਗਲਾਸ', p_animal: 'ਜਾਨਵਰ ਨੂੰ ਖਾਣਾ', p_tetee: 'ਦੁੱਧ ਚੁੰਘਾਉਣਾ', p_berceuse: 'ਲੋਰੀ',
      p_journee: 'ਦਿਨ ਦੀਆਂ ਗੱਲਾਂ', p_respiration: 'ਸ਼ਾਂਤ ਸਾਹ', p_priere: 'ਅਰਦਾਸ', p_bisous: 'ਸਾਰਿਆਂ ਨੂੰ ਪਿਆਰ',
      tabSteps: 'ਕਦਮ', tabApp: 'ਐਪ',
    } },
    pl: { name: 'Polski', dir: 'ltr', s: {
      appTitle: 'Pora spać!', subtitle: 'Wieczorny rytuał', start: 'Rozpocznij rytuał',
      settings: 'Ustawienia', back: 'Wstecz', sounds: 'Dźwięki', introAnim: 'Animacja początkowa',
      language: 'Język', defaults: 'Przywróć domyślne', defaultsConfirm: 'Przywrócić ustawienia domyślne?',
      defaultsDone: 'Ustawienia przywrócone', needOneStep: 'Przynajmniej jeden etap musi być włączony',
      total: 'Łączny czas: {n} min', minUnit: 'min', pause: 'Pauza', resume: 'Wznów',
      prevStep: 'Poprzedni etap', nextStep: 'Następny etap', stop: 'Zakończ',
      stopConfirm: 'Zakończyć rytuał?', endTitle: 'Pora spać!', endMsg: 'Dobranoc, kolorowych snów ✨',
      finish: 'Gotowe', sleep: 'Pora spać!', tapSkip: 'Dotknij ekranu, aby pominąć',
      p_pyjama: 'Piżama', p_histoire: 'Bajka', p_biberon: 'Butelka', p_dents: 'Ząbki', p_calin: 'Przytulanie',
      myRitual: 'Mój rytuał', catHyg: 'Higiena i pielęgnacja', catNight: 'Przygotowanie do nocy', catCalm: 'Spokojne chwile',
      support: 'Wesprzyj aplikację',
      p_pot: 'Nocnik', p_couche: 'Pieluszka', p_bain: 'Kąpiel', p_debarbouillage: 'Mycie buzi',
      p_massage: 'Krem / masaż', p_medicament: 'Lekarstwo', p_rangement: 'Sprzątanie zabawek',
      p_chambre: 'Przygotowanie pokoju', p_veilleuse: 'Lampka nocna', p_doudou: 'Przytulanka i smoczek',
      p_eau: 'Szklanka wody', p_animal: 'Karmienie zwierzaka', p_tetee: 'Karmienie piersią', p_berceuse: 'Kołysanka',
      p_journee: 'Opowieść o dniu', p_respiration: 'Spokojny oddech', p_priere: 'Modlitwa', p_bisous: 'Buziaki dla wszystkich',
      tabSteps: 'Etapy', tabApp: 'Aplikacja',
    } },
    uk: { name: 'Українська', dir: 'ltr', s: {
      appTitle: 'Час спати!', subtitle: 'Вечірній ритуал', start: 'Почати ритуал',
      settings: 'Налаштування', back: 'Назад', sounds: 'Звуки', introAnim: 'Початкова анімація',
      language: 'Мова', defaults: 'Скинути налаштування', defaultsConfirm: 'Повернути налаштування за замовчуванням?',
      defaultsDone: 'Налаштування скинуто', needOneStep: 'Потрібен хоча б один активний етап',
      total: 'Загальний час: {n} хв', minUnit: 'хв', pause: 'Пауза', resume: 'Продовжити',
      prevStep: 'Попередній етап', nextStep: 'Наступний етап', stop: 'Стоп',
      stopConfirm: 'Завершити ритуал?', endTitle: 'Час спати!', endMsg: 'На добраніч, солодких снів ✨',
      finish: 'Готово', sleep: 'Час спати!', tapSkip: 'Торкніться екрана, щоб пропустити',
      p_pyjama: 'Піжама', p_histoire: 'Казка', p_biberon: 'Пляшечка', p_dents: 'Зубки', p_calin: 'Обійми',
      myRitual: 'Мій ритуал', catHyg: 'Гігієна та догляд', catNight: 'Підготовка до ночі', catCalm: 'Спокійні хвилини',
      support: 'Підтримати застосунок',
      p_pot: 'Горщик', p_couche: 'Підгузок', p_bain: 'Купання', p_debarbouillage: 'Вмивання',
      p_massage: 'Крем / масаж', p_medicament: 'Ліки', p_rangement: 'Прибрати іграшки',
      p_chambre: 'Підготувати кімнату', p_veilleuse: 'Нічник', p_doudou: 'Іграшка та пустушка',
      p_eau: 'Склянка води', p_animal: 'Погодувати улюбленця', p_tetee: 'Грудне годування', p_berceuse: 'Колискова',
      p_journee: 'Розповідь про день', p_respiration: 'Спокійне дихання', p_priere: 'Молитва', p_bisous: 'Поцілунки всім',
      tabSteps: 'Етапи', tabApp: 'Застосунок',
    } },
  };

  // Clés « Coucher » (heure de début + rappel), fusionnées dans I18N ci-dessus
  const I18N_BEDTIME = {
    fr: { bedtimeSection: 'Coucher', bedtimeLabel: 'Heure du coucher', reminderLabel: 'Me prévenir 15 min avant', reminderAt: 'Notification à {time}', reminderNative: "Disponible sur l'app installée" },
    en: { bedtimeSection: 'Bedtime', bedtimeLabel: 'Bedtime', reminderLabel: 'Remind me 15 min before', reminderAt: 'Notification at {time}', reminderNative: 'Available in the installed app' },
    zh: { bedtimeSection: '就寝', bedtimeLabel: '就寝时间', reminderLabel: '提前 15 分钟提醒我', reminderAt: '将在 {time} 通知', reminderNative: '需在已安装的应用中使用' },
    hi: { bedtimeSection: 'सोने का समय', bedtimeLabel: 'सोने का समय', reminderLabel: '15 मिनट पहले याद दिलाएँ', reminderAt: '{time} पर सूचना', reminderNative: 'इंस्टॉल किए गए ऐप में उपलब्ध' },
    es: { bedtimeSection: 'Hora de dormir', bedtimeLabel: 'Hora de acostarse', reminderLabel: 'Avisarme 15 min antes', reminderAt: 'Notificación a las {time}', reminderNative: 'Disponible en la app instalada' },
    ar: { bedtimeSection: 'وقت النوم', bedtimeLabel: 'وقت النوم', reminderLabel: 'ذكّرني قبل 15 دقيقة', reminderAt: 'إشعار في {time}', reminderNative: 'متاح في التطبيق المثبَّت' },
    bn: { bedtimeSection: 'ঘুমের সময়', bedtimeLabel: 'ঘুমের সময়', reminderLabel: '১৫ মিনিট আগে মনে করিয়ে দাও', reminderAt: '{time}-এ বিজ্ঞপ্তি', reminderNative: 'ইনস্টল করা অ্যাপে উপলব্ধ' },
    pt: { bedtimeSection: 'Hora de dormir', bedtimeLabel: 'Hora de dormir', reminderLabel: 'Avisar 15 min antes', reminderAt: 'Notificação às {time}', reminderNative: 'Disponível no app instalado' },
    ru: { bedtimeSection: 'Отход ко сну', bedtimeLabel: 'Время сна', reminderLabel: 'Напомнить за 15 мин', reminderAt: 'Уведомление в {time}', reminderNative: 'Доступно в установленном приложении' },
    ur: { bedtimeSection: 'سونے کا وقت', bedtimeLabel: 'سونے کا وقت', reminderLabel: '15 منٹ پہلے یاد دلائیں', reminderAt: '{time} پر اطلاع', reminderNative: 'انسٹال شدہ ایپ میں دستیاب' },
    id: { bedtimeSection: 'Waktu tidur', bedtimeLabel: 'Waktu tidur', reminderLabel: 'Ingatkan 15 mnt sebelumnya', reminderAt: 'Notifikasi pukul {time}', reminderNative: 'Tersedia di aplikasi terpasang' },
    de: { bedtimeSection: 'Schlafenszeit', bedtimeLabel: 'Schlafenszeit', reminderLabel: '15 Min vorher erinnern', reminderAt: 'Benachrichtigung um {time}', reminderNative: 'In der installierten App verfügbar' },
    ja: { bedtimeSection: '就寝', bedtimeLabel: '就寝時刻', reminderLabel: '15分前に知らせる', reminderAt: '{time} に通知', reminderNative: 'インストール済みアプリで利用可能' },
    sw: { bedtimeSection: 'Wakati wa kulala', bedtimeLabel: 'Saa ya kulala', reminderLabel: 'Nikumbushe dakika 15 kabla', reminderAt: 'Arifa saa {time}', reminderNative: 'Inapatikana kwenye programu iliyosakinishwa' },
    mr: { bedtimeSection: 'झोपण्याची वेळ', bedtimeLabel: 'झोपण्याची वेळ', reminderLabel: '15 मिनिटे आधी आठवण करा', reminderAt: '{time} वाजता सूचना', reminderNative: 'इंस्टॉल केलेल्या अ‍ॅपमध्ये उपलब्ध' },
    te: { bedtimeSection: 'నిద్రవేళ', bedtimeLabel: 'నిద్రవేళ', reminderLabel: '15 నిమిషాల ముందు గుర్తు చేయి', reminderAt: '{time}కి నోటిఫికేషన్', reminderNative: 'ఇన్‌స్టాల్ చేసిన యాప్‌లో అందుబాటులో ఉంది' },
    tr: { bedtimeSection: 'Uyku vakti', bedtimeLabel: 'Yatma saati', reminderLabel: '15 dk önce hatırlat', reminderAt: 'Bildirim: {time}', reminderNative: 'Yüklü uygulamada kullanılabilir' },
    ta: { bedtimeSection: 'தூங்கும் நேரம்', bedtimeLabel: 'தூங்கும் நேரம்', reminderLabel: '15 நிமிடம் முன் நினைவூட்டு', reminderAt: '{time} மணிக்கு அறிவிப்பு', reminderNative: 'நிறுவிய ஆப்பில் கிடைக்கும்' },
    vi: { bedtimeSection: 'Giờ đi ngủ', bedtimeLabel: 'Giờ đi ngủ', reminderLabel: 'Nhắc trước 15 phút', reminderAt: 'Thông báo lúc {time}', reminderNative: 'Có trong ứng dụng đã cài đặt' },
    ko: { bedtimeSection: '취침', bedtimeLabel: '취침 시간', reminderLabel: '15분 전에 알림', reminderAt: '{time}에 알림', reminderNative: '설치된 앱에서 사용 가능' },
    tl: { bedtimeSection: 'Oras ng tulog', bedtimeLabel: 'Oras ng tulog', reminderLabel: 'Ipaalala 15 min bago', reminderAt: 'Abiso sa {time}', reminderNative: 'Magagamit sa naka-install na app' },
    fa: { bedtimeSection: 'زمان خواب', bedtimeLabel: 'زمان خواب', reminderLabel: '۱۵ دقیقه قبل یادآوری کن', reminderAt: 'اعلان در {time}', reminderNative: 'در برنامهٔ نصب‌شده در دسترس است' },
    it: { bedtimeSection: 'Nanna', bedtimeLabel: 'Ora della nanna', reminderLabel: 'Avvisami 15 min prima', reminderAt: 'Notifica alle {time}', reminderNative: "Disponibile nell'app installata" },
    th: { bedtimeSection: 'เวลานอน', bedtimeLabel: 'เวลาเข้านอน', reminderLabel: 'เตือนล่วงหน้า 15 นาที', reminderAt: 'แจ้งเตือนเวลา {time}', reminderNative: 'ใช้ได้ในแอปที่ติดตั้งแล้ว' },
    pa: { bedtimeSection: 'ਸੌਣ ਦਾ ਸਮਾਂ', bedtimeLabel: 'ਸੌਣ ਦਾ ਸਮਾਂ', reminderLabel: '15 ਮਿੰਟ ਪਹਿਲਾਂ ਯਾਦ ਕਰਾਓ', reminderAt: '{time} ਵਜੇ ਸੂਚਨਾ', reminderNative: 'ਇੰਸਟਾਲ ਕੀਤੀ ਐਪ ਵਿੱਚ ਉਪਲਬਧ' },
    pl: { bedtimeSection: 'Pora snu', bedtimeLabel: 'Pora snu', reminderLabel: 'Przypomnij 15 min wcześniej', reminderAt: 'Powiadomienie o {time}', reminderNative: 'Dostępne w zainstalowanej aplikacji' },
    uk: { bedtimeSection: 'Час сну', bedtimeLabel: 'Час сну', reminderLabel: 'Нагадати за 15 хв', reminderAt: 'Сповіщення о {time}', reminderNative: 'Доступно у встановленому застосунку' },
  };
  Object.keys(I18N_BEDTIME).forEach((code) => {
    if (I18N[code]) Object.assign(I18N[code].s, I18N_BEDTIME[code]);
  });

  // ---------- Configuration externe ----------
  // À renseigner pour activer le don et la mesure d'audience :
  const KOFI_URL = 'https://ko-fi.com/bedtimeroutine';  // vide = boutons masqués
  const UMAMI_ID = '07651324-c6f4-4362-a595-5dea41ad7d2e';  // vide = mesure désactivée

  const SETTINGS_KEY = 'dodo.settings';
  const RUN_KEY = 'dodo.run';
  const STALE_MS = 3 * 60 * 60 * 1000; // rituel abandonné depuis > 3 h

  // Mode test : ?speed=60 -> le temps passe 60x plus vite
  const SPEED = (() => {
    const s = parseFloat(new URLSearchParams(location.search).get('speed'));
    return Number.isFinite(s) && s > 0 ? s : 1;
  })();

  // Géométrie du sablier (viewBox 320x480, symétrique pour le retournement)
  const SAND = {
    topY: 50,       // haut de l'ampoule supérieure
    neckTopY: 236,  // col, côté supérieur
    neckBotY: 244,  // col, côté inférieur
    botY: 430,      // plancher de l'ampoule inférieure
    left: 64,
    width: 192,
    fillH: 178,     // hauteur de sable d'une étape (léger vide en haut de l'ampoule)
  };

  const FLIP_MS = 800; // durée de l'animation de retournement

  // ---------- État ----------

  let settings = loadSettings();
  let run = null;       // { startedAt, totalPaused, pausedAt, skipOffset, phases, soundOn, updatedAt }
  let schedule = null;  // { phases, dur[], cumStart[], total }
  const openCats = new Set();
  let blinkCat = null;
  let curIdx = -1;
  let rafId = 0;
  let watchdogId = 0;
  let lastFrameAt = 0;
  let lastClockText = '';
  let wakeLock = null;
  let toastTimer = 0;

  // Éléments créés à chaque rituel
  let topSandEl = null;
  let botSandEl = null;
  let moundEl = null;
  let chipEls = [];
  let progFills = [];
  let flipping = false;
  let flipTimer = 0;
  let flipStartedAt = 0;
  let flipNewColor = null;

  const $ = (id) => document.getElementById(id);

  // ---------- i18n ----------

  function t(key) {
    const pack = I18N[settings && settings.lang] || I18N.fr;
    const v = pack.s[key];
    return v != null ? v : (I18N.fr.s[key] != null ? I18N.fr.s[key] : key);
  }

  const phaseLabel = (p) => t('p_' + p.id) !== 'p_' + p.id ? t('p_' + p.id) : p.label;

  function soundEnabled() {
    return run ? run.soundOn !== false : settings.soundOn !== false;
  }

  // Heure stockée en 24 h "HH:MM" ; affichée selon l'horloge de l'appareil (24 h / AM-PM auto)
  function fmtTime(hhmm) {
    const m = /^(\d{2}):(\d{2})$/.exec(hhmm || '');
    if (!m) return hhmm || '';
    const d = new Date();
    d.setHours(+m[1], +m[2], 0, 0);
    try {
      return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', numberingSystem: 'latn' }).format(d);
    } catch {
      return hhmm;
    }
  }

  // Heure du rappel = coucher − 15 min (renvoie "HH:MM" en 24 h)
  function reminderTime(hhmm) {
    const m = /^(\d{2}):(\d{2})$/.exec(hhmm || '');
    if (!m) return '';
    let total = ((+m[1] * 60 + +m[2] - 15) % 1440 + 1440) % 1440;
    return String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0');
  }

  // Vrai uniquement dans la build native (Capacitor) — la notif planifiée n'y est fiable que là
  function isNativeApp() {
    try {
      return !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
    } catch {
      return false;
    }
  }

  // ---------- Stockage ----------

  function clampMin(m) {
    return Math.min(60, Math.max(1, Math.round(Number(m) || 1)));
  }

  function validBedtime(v) {
    return typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
  }

  // Langue de l'appareil si on l'a, sinon anglais
  function detectLang() {
    const codes = (navigator.languages || [navigator.language || 'en']).map((c) => String(c).toLowerCase());
    for (const c of codes) {
      const two = c.slice(0, 2);
      if (I18N[two]) return two;
    }
    return 'en';
  }

  function loadSettings() {
    try {
      const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY));
      if (!raw || !Array.isArray(raw.phases)) throw new Error('vide');
      const byId = Object.fromEntries(DEFAULT_PHASES.map((p) => [p.id, p]));
      const phases = raw.phases
        .filter((p) => p && byId[p.id])
        .map((p) => ({ ...byId[p.id], minutes: clampMin(p.minutes), enabled: p.enabled !== false }));
      // Les nouvelles étapes par défaut s'insèrent à leur position d'origine
      DEFAULT_PHASES.forEach((d, idx) => {
        if (!phases.some((p) => p.id === d.id)) phases.splice(Math.min(idx, phases.length), 0, { ...d });
      });
      if (!phases.some((p) => p.enabled)) phases[0].enabled = true;
      return {
        phases,
        soundOn: raw.soundOn !== false,
        introOn: raw.introOn !== false,
        lang: I18N[raw.lang] ? raw.lang : detectLang(),
        bedtime: validBedtime(raw.bedtime) ? raw.bedtime : '20:00',
        reminderOn: raw.reminderOn === true,
      };
    } catch {
      return { phases: DEFAULT_PHASES.map((p) => ({ ...p })), soundOn: true, introOn: true, lang: detectLang(), bedtime: '20:00', reminderOn: false };
    }
  }

  function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch {}
  }

  function saveRun() {
    if (!run) return;
    run.updatedAt = Date.now();
    try { localStorage.setItem(RUN_KEY, JSON.stringify(run)); } catch {}
  }

  function clearRun() {
    run = null;
    try { localStorage.removeItem(RUN_KEY); } catch {}
  }

  function loadRun() {
    try {
      const r = JSON.parse(localStorage.getItem(RUN_KEY));
      if (!r || !r.startedAt || !Array.isArray(r.phases) || !r.phases.length) return null;
      if (Date.now() - (r.updatedAt || r.startedAt) > STALE_MS) return null;
      return r;
    } catch {
      return null;
    }
  }

  // ---------- Moteur de temps ----------

  function buildSchedule(phases) {
    const ph = phases.filter((p) => p.enabled);
    const dur = ph.map((p) => p.minutes * 60000);
    const cum = [0];
    for (const d of dur) cum.push(cum[cum.length - 1] + d);
    return { phases: ph, dur, cumStart: cum.slice(0, -1), total: cum[cum.length - 1] };
  }

  function vNow() {
    const now = Date.now();
    const pausedExtra = run.pausedAt ? now - run.pausedAt : 0;
    return (now - run.startedAt - run.totalPaused - pausedExtra) * SPEED + run.skipOffset;
  }

  function phaseAt(v) {
    if (v >= schedule.total) return schedule.phases.length;
    let i = 0;
    while (i < schedule.phases.length - 1 && v >= schedule.cumStart[i + 1]) i++;
    return i;
  }

  const colorOf = (p) => COLORS[p.id] || FALLBACK_COLOR;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  // ---------- Cycle de vie du rituel ----------

  function startRitual() {
    const active = settings.phases.filter((p) => p.enabled);
    if (!active.length) { toast(t('needOneStep')); return; }
    ensureAudio();
    if (settings.introOn) playIntro(active, beginRun);
    else beginRun();
  }

  // ---------- Intro animée : récapitule les étapes jusqu'au dodo ----------

  let introTimer = 0;
  let introDone = null;

  function playIntro(phases, done) {
    const steps = phases
      .map((p) => ({ emoji: p.emoji, label: phaseLabel(p), color: colorOf(p) }))
      .concat([{ emoji: '🌙', label: t('sleep'), color: '#f6e7b0' }]);

    const ov = $('intro');
    const dots = $('introDots');
    dots.innerHTML = '';
    steps.forEach(() => dots.appendChild(document.createElement('span')));
    $('introHint').textContent = t('tapSkip');
    ov.classList.remove('out');
    ov.hidden = false;
    introDone = done;

    let i = -1;
    const NOTES = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
    const showStep = () => {
      i++;
      if (i >= steps.length) { closeIntro(); return; }
      const s = steps[i];
      $('introEmoji').textContent = s.emoji;
      $('introLabel').textContent = s.label;
      $('introLabel').style.color = s.color;
      const card = $('introCard');
      card.classList.remove('pop');
      void card.offsetWidth;
      card.classList.add('pop');
      [...dots.children].forEach((d, j) => {
        d.classList.toggle('on', j === i);
        d.classList.toggle('past', j < i);
      });
      if (soundEnabled()) tone(NOTES[i % NOTES.length], 0, 0.6, 0.11);
      clearTimeout(introTimer);
      introTimer = setTimeout(showStep, i === steps.length - 1 ? 2100 : 1500);
    };
    showStep();
  }

  function closeIntro(skipped) {
    clearTimeout(introTimer);
    const done = introDone;
    introDone = null;
    const ov = $('intro');
    if (ov.hidden) return;
    if (done) track(skipped === true ? 'intro_passee' : 'intro_jouee');
    ov.classList.add('out');
    setTimeout(() => { ov.hidden = true; ov.classList.remove('out'); }, 240);
    if (done) done();
  }

  function beginRun() {
    const active = settings.phases.filter((p) => p.enabled);
    if (!active.length) return;
    run = {
      startedAt: Date.now(),
      totalPaused: 0,
      pausedAt: null,
      skipOffset: 0,
      phases: active.map((p) => ({ ...p })),
      soundOn: settings.soundOn,
      updatedAt: Date.now(),
    };
    schedule = buildSchedule(run.phases);
    curIdx = -1;
    lastClockText = '';
    cancelFlip();
    saveRun();
    buildRitualDom();
    showScreen('ritual');
    syncPauseUi();
    acquireWakeLock();
    startLoop();
    track('rituel_demarre', {
      etapes: schedule.phases.length,
      duree_min: Math.round(schedule.total / 60000),
      langue: settings.lang,
      mode: isStandalone() ? 'app' : 'navigateur',
    });
  }

  function resumeFromStorage() {
    const r = loadRun();
    if (!r) return false;
    run = r;
    schedule = buildSchedule(run.phases);
    if (!schedule.phases.length) { clearRun(); return false; }
    if (vNow() >= schedule.total) { clearRun(); return false; }
    curIdx = -1;
    lastClockText = '';
    cancelFlip();
    buildRitualDom();
    showScreen('ritual');
    syncPauseUi();
    if (!run.pausedAt) acquireWakeLock();
    startLoop();
    return true;
  }

  function tickOnce() {
    if (!run) return;
    const v = Math.max(0, vNow());
    const idx = phaseAt(v);
    if (idx >= schedule.phases.length) {
      finishRitual();
      return;
    }
    if (idx !== curIdx) {
      const prevIdx = curIdx;
      curIdx = idx;
      onPhaseChange(prevIdx === -1, prevIdx !== -1 && idx < prevIdx);
    }
    if (flipping && Date.now() - flipStartedAt > FLIP_MS + 300) endFlip();
    renderSand(v);
    renderClock(v);
    if (Date.now() - run.updatedAt > 10000) saveRun();
  }

  function startLoop() {
    stopLoop();
    const loop = () => {
      if (!run) return;
      lastFrameAt = Date.now();
      tickOnce();
      if (!run) return;
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    // Garde-fou : si rAF est gelé (page non rendue, throttling), on continue de
    // faire avancer la logique a basse frequence.
    watchdogId = setInterval(() => {
      if (run && Date.now() - lastFrameAt > 600) tickOnce();
    }, 500);
  }

  function stopLoop() {
    cancelAnimationFrame(rafId);
    clearInterval(watchdogId);
  }

  function onPhaseChange(isStart, backward) {
    const p = schedule.phases[curIdx];
    const color = colorOf(p);
    $('phaseEmoji').textContent = p.emoji;
    $('phaseLabel').textContent = phaseLabel(p);
    document.body.style.setProperty('--accent', color);
    $('stream').setAttribute('fill', color);
    $('particles').setAttribute('fill', color);
    chipEls.forEach((el, i) => {
      el.classList.toggle('done', i < curIdx);
      el.classList.toggle('current', i === curIdx);
    });
    updateTrail();
    const em = $('phaseEmoji');
    em.classList.remove('pop');
    void em.offsetWidth;
    em.classList.add('pop');
    if (isStart) {
      setSandColor(color);
    } else {
      chime();
      startFlip(color, backward);
    }
  }

  function pauseToggle() {
    if (!run) return;
    if (run.pausedAt) {
      run.totalPaused += Date.now() - run.pausedAt;
      run.pausedAt = null;
      acquireWakeLock();
    } else {
      run.pausedAt = Date.now();
      releaseWakeLock();
    }
    saveRun();
    syncPauseUi();
  }

  function syncPauseUi() {
    const paused = !!(run && run.pausedAt);
    $('screen-ritual').classList.toggle('paused', paused);
    $('pauseOverlay').hidden = !paused;
    $('btnPause').textContent = paused ? '▶' : '⏸';
    $('btnPause').title = paused ? t('resume') : t('pause');
  }

  function skipPhase() {
    if (!run || curIdx < 0) return;
    const v = vNow();
    const end = schedule.cumStart[curIdx] + schedule.dur[curIdx];
    run.skipOffset += Math.max(0, end - v);
    saveRun();
    track('etape_passee', { etape: schedule.phases[curIdx].id });
  }

  function prevPhase() {
    if (!run || curIdx < 0) return;
    const v = vNow();
    const targetIdx = Math.max(0, curIdx - 1);
    run.skipOffset -= v - schedule.cumStart[targetIdx];
    saveRun();
    track('etape_precedente', { etape: schedule.phases[curIdx].id });
    if (targetIdx === curIdx) {
      // Déjà sur la première étape : on la redémarre
      chime();
      startFlip(colorOf(schedule.phases[curIdx]), true);
    }
  }

  function stopRitual() {
    if (!confirm(t('stopConfirm'))) return;
    const etape = curIdx >= 0 && schedule && schedule.phases[curIdx] ? schedule.phases[curIdx].id : '';
    stopLoop();
    cancelFlip();
    releaseWakeLock();
    clearRun();
    renderHome();
    showScreen('home');
    track('rituel_arrete', { etape });
  }

  function finishRitual() {
    stopLoop();
    cancelFlip();
    releaseWakeLock();
    lullaby();
    clearRun();
    showScreen('end');
    track('rituel_termine');
  }

  // ---------- Rendu du sablier ----------

  function svgEl(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  function buildRitualDom() {
    const top = $('sandTop');
    const bot = $('sandBot');
    top.innerHTML = '';
    bot.innerHTML = '';
    const color = colorOf(schedule.phases[0]);
    topSandEl = svgEl('rect', { x: SAND.left, y: SAND.neckTopY, width: SAND.width, height: 0, fill: color });
    botSandEl = svgEl('rect', { x: SAND.left, y: SAND.botY, width: SAND.width, height: 0, fill: color });
    moundEl = svgEl('ellipse', { cx: 160, cy: SAND.botY, rx: 40, ry: 9, fill: color, opacity: 0 });
    top.appendChild(topSandEl);
    bot.appendChild(botSandEl);
    bot.appendChild(moundEl);

    const trailRow = $('trailRow');
    trailRow.innerHTML = '';
    chipEls = schedule.phases.map((p) => {
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.textContent = p.emoji;
      trailRow.appendChild(chip);
      return chip;
    });

    const prog = $('progress');
    prog.innerHTML = '';
    progFills = schedule.phases.map((p, i) => {
      const seg = document.createElement('div');
      seg.className = 'pseg';
      seg.style.flexGrow = String(schedule.dur[i]);
      const fill = document.createElement('div');
      fill.className = 'pfill';
      fill.style.background = colorOf(p);
      seg.appendChild(fill);
      prog.appendChild(seg);
      return fill;
    });
  }

  // Fenêtre glissante de la frise : l'étape en cours reste centrée,
  // les pastilles gardent leur taille pleine quel que soit le nombre d'étapes.
  function updateTrail() {
    const vp = $('trail');
    const row = $('trailRow');
    const n = chipEls.length;
    if (!n) return;
    const vw = vp.clientWidth;
    const chipW = 56;
    const gap = 12;
    const rowW = n * chipW + (n - 1) * gap;
    let tx;
    if (rowW <= vw) {
      tx = (vw - rowW) / 2;
      vp.classList.remove('slide');
    } else {
      const i = Math.max(0, curIdx);
      tx = vw / 2 - (i * (chipW + gap) + chipW / 2);
      tx = Math.min(0, Math.max(vw - rowW, tx));
      vp.classList.add('slide');
    }
    row.style.transform = 'translateX(' + tx + 'px)';
  }

  function setSandColor(color) {
    topSandEl.setAttribute('fill', color);
    botSandEl.setAttribute('fill', color);
    moundEl.setAttribute('fill', color);
  }

  function renderSand(v) {
    // Barre de progression globale (un segment par étape)
    for (let i = 0; i < schedule.phases.length; i++) {
      const pct = clamp((v - schedule.cumStart[i]) / schedule.dur[i], 0, 1) * 100;
      progFills[i].style.width = pct + '%';
    }

    if (flipping) return; // le sablier en rotation garde l'état de l'étape finie

    // Le sablier représente l'étape en cours : il se vide entièrement pendant l'étape
    const frac = clamp((v - schedule.cumStart[curIdx]) / schedule.dur[curIdx], 0, 1);
    const topH = (1 - frac) * SAND.fillH;
    const botH = frac * SAND.fillH;
    topSandEl.setAttribute('y', SAND.neckTopY - topH);
    topSandEl.setAttribute('height', topH);
    botSandEl.setAttribute('y', SAND.botY - botH);
    botSandEl.setAttribute('height', botH);
    moundEl.setAttribute('cy', SAND.botY - botH);
    moundEl.setAttribute('opacity', Math.min(1, botH / 10).toFixed(2));

    // Filet de sable, du col au sommet du tas
    const stream = $('stream');
    if (topH > 0.5 && v < schedule.total) {
      stream.setAttribute('y', SAND.neckTopY + 2);
      stream.setAttribute('height', Math.max(0, SAND.botY - botH - SAND.neckTopY - 2));
    } else {
      stream.setAttribute('height', 0);
    }
  }

  function startFlip(newColor, backward) {
    flipping = true;
    flipStartedAt = Date.now();
    flipNewColor = newColor;
    $('screen-ritual').classList.add('flipping');
    $('stream').setAttribute('height', 0);
    const hg = $('hourglass');
    hg.classList.remove('flip', 'flip-back');
    void hg.getBoundingClientRect(); // force le redémarrage de la transition
    hg.classList.add(backward ? 'flip-back' : 'flip');
    clearTimeout(flipTimer);
    flipTimer = setTimeout(endFlip, FLIP_MS + 50);
  }

  // Fin de rotation : appelée par le timer, ou par la boucle de tick si le
  // timer a été étranglé (page cachée, téléphone verrouillé pendant le flip).
  function endFlip() {
    if (!flipping) return;
    clearTimeout(flipTimer);
    $('hourglass').classList.remove('flip', 'flip-back'); // retour instantané à 0° : silhouette identique (symétrie)
    $('screen-ritual').classList.remove('flipping');
    if (flipNewColor) setSandColor(flipNewColor);
    flipping = false;
    if (run) renderSand(Math.max(0, vNow()));
  }

  function cancelFlip() {
    clearTimeout(flipTimer);
    flipping = false;
    flipNewColor = null;
    $('hourglass').classList.remove('flip', 'flip-back');
    $('screen-ritual').classList.remove('flipping');
  }

  function renderClock(v) {
    const remMs = schedule.cumStart[curIdx] + schedule.dur[curIdx] - v;
    const s = Math.max(0, Math.ceil(remMs / 1000));
    const text = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    if (text !== lastClockText) {
      lastClockText = text;
      $('phaseTime').textContent = text;
    }
  }

  // ---------- Audio (WebAudio, aucun fichier) ----------

  let ac = null;

  function ensureAudio() {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
    } catch {}
  }

  function tone(freq, when, dur, peak) {
    if (!ac) return;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    o.connect(g);
    g.connect(ac.destination);
    const t = ac.currentTime + when;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function chime() {
    if (!soundEnabled()) return;
    ensureAudio();
    tone(659.25, 0, 1.1, 0.15);   // mi5
    tone(783.99, 0.22, 1.3, 0.12); // sol5
  }

  function lullaby() {
    if (!soundEnabled()) return;
    ensureAudio();
    const notes = [[783.99, 0], [659.25, 0.4], [587.33, 0.8], [523.25, 1.2]];
    notes.forEach(([f, w], i) => tone(f, w, i === notes.length - 1 ? 2.2 : 1.0, 0.13));
  }

  // ---------- Écran allumé ----------

  async function acquireWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen');
      }
    } catch {}
  }

  function releaseWakeLock() {
    try { if (wakeLock) wakeLock.release(); } catch {}
    wakeLock = null;
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && run && !run.pausedAt) acquireWakeLock();
  });

  // ---------- Mesure d'audience anonyme (Umami, sans cookie) ----------

  function analyticsEnabled() {
    return !!UMAMI_ID && !['localhost', '127.0.0.1'].includes(location.hostname);
  }

  function injectUmami() {
    if (!analyticsEnabled()) return;
    const s = document.createElement('script');
    s.defer = true;
    s.src = 'https://cloud.umami.is/script.js';
    s.setAttribute('data-website-id', UMAMI_ID);
    document.head.appendChild(s);
  }

  function track(name, props) {
    try {
      if (window.umami && typeof window.umami.track === 'function') window.umami.track(name, props || {});
    } catch {}
  }

  function isStandalone() {
    return (window.matchMedia && matchMedia('(display-mode: standalone)').matches)
      || window.navigator.standalone === true;
  }

  // ---------- Écrans ----------

  function showTab(which) {
    $('tabSteps').classList.toggle('on', which === 'steps');
    $('tabApp').classList.toggle('on', which === 'app');
    $('paneSteps').hidden = which !== 'steps';
    $('paneApp').hidden = which !== 'app';
  }

  function showScreen(name) {
    document.querySelectorAll('.screen').forEach((s) => {
      s.classList.toggle('active', s.id === 'screen-' + name);
    });
    if (name === 'home') setTimeout(updateHomeFade, 60);
  }

  // Fondu en bas de la liste d'accueil tant qu'il reste du contenu à faire défiler
  function updateHomeFade() {
    const l = $('homeList');
    l.classList.toggle('more', l.scrollHeight - l.scrollTop - l.clientHeight > 8);
  }

  function totalMinutes() {
    return settings.phases.filter((p) => p.enabled).reduce((acc, p) => acc + p.minutes, 0);
  }

  function renderHome() {
    const list = $('homeList');
    list.innerHTML = '';
    settings.phases.filter((p) => p.enabled).forEach((p) => {
      const li = document.createElement('li');
      const dot = document.createElement('span');
      dot.className = 'pl-dot';
      dot.style.background = colorOf(p);
      const emoji = document.createElement('span');
      emoji.className = 'pl-emoji';
      emoji.textContent = p.emoji;
      const label = document.createElement('span');
      label.className = 'pl-label';
      label.textContent = phaseLabel(p);
      const min = document.createElement('span');
      min.className = 'pl-min';
      min.textContent = p.minutes + ' ' + t('minUnit');
      li.append(dot, emoji, label, min);
      list.appendChild(li);
    });
    $('homeTotal').textContent = t('total').replace('{n}', totalMinutes());
    updateHomeFade();
  }

  function renderBedtime() {
    const input = $('bedtimeInput');
    if (!input) return;
    input.value = settings.bedtime;
    $('reminderToggle').checked = settings.reminderOn;
    const sub = $('reminderSub');
    sub.textContent = settings.reminderOn ? t('reminderAt').replace('{time}', fmtTime(reminderTime(settings.bedtime))) : '';
    const hint = $('reminderHint');
    // Sur le web, la notif planifiée n'est pas fiable : on l'indique quand le rappel est activé
    const showHint = settings.reminderOn && !isNativeApp();
    hint.textContent = showHint ? t('reminderNative') : '';
    hint.hidden = !showHint;
  }

  // Planifie / annule le rappel quotidien (coucher − 15 min). Effectif uniquement dans la build
  // native (Capacitor expose le plugin sur window.Capacitor.Plugins) ; no-op sur le web.
  // canRequest : demander la permission si besoin (true au clic utilisateur, false au démarrage).
  const REMINDER_ID = 1;
  async function syncReminder(canRequest) {
    const LN = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications;
    if (!isNativeApp() || !LN) return;
    try {
      // Toujours repartir d'un rappel propre
      try { await LN.cancel({ notifications: [{ id: REMINDER_ID }] }); } catch {}
      if (!settings.reminderOn || !validBedtime(settings.bedtime)) return;
      let perm = await LN.checkPermissions();
      if (perm.display !== 'granted') {
        if (!canRequest) return;
        perm = await LN.requestPermissions();
        if (perm.display !== 'granted') return;
      }
      const [h, m] = reminderTime(settings.bedtime).split(':').map(Number);
      await LN.schedule({ notifications: [{
        id: REMINDER_ID,
        title: t('appTitle'),
        body: t('start'),
        schedule: { on: { hour: h, minute: m }, allowWhileIdle: true },
      }] });
    } catch {}
  }

  function applyLang() {
    const pack = I18N[settings.lang] || I18N.fr;
    document.documentElement.lang = settings.lang;
    document.documentElement.dir = pack.dir;
    document.title = t('appTitle') + ' — ' + t('subtitle');
    $('homeTitle').textContent = t('appTitle');
    $('homeSub').textContent = t('subtitle');
    $('btnStart').textContent = '🌙  ' + t('start');
    $('btnSettings').textContent = '⚙️  ' + t('settings');
    $('settingsTitle').textContent = t('settings');
    $('btnBack').textContent = (pack.dir === 'rtl' ? '→ ' : '← ') + t('back');
    $('lblSounds').textContent = t('sounds');
    $('lblIntro').textContent = t('introAnim');
    $('lblLang').textContent = t('language');
    $('secBedtime').textContent = t('bedtimeSection');
    $('lblBedtime').textContent = t('bedtimeLabel');
    $('lblReminder').textContent = t('reminderLabel');
    $('btnDefaults').textContent = t('defaults');
    $('tabSteps').textContent = t('tabSteps');
    $('tabApp').textContent = t('tabApp');
    $('endTitle').textContent = t('endTitle');
    $('endMsg').textContent = t('endMsg');
    $('btnEndHome').textContent = t('finish');
    $('pauseOverlay').textContent = '⏸ ' + t('pause');
    $('kofiSettings').textContent = '☕ ' + t('support');
    $('kofiEnd').textContent = '☕ ' + t('support');
    $('btnPrev').title = t('prevStep');
    $('btnSkip').title = t('nextStep');
    $('btnStop').title = t('stop');
    $('langSelect').value = settings.lang;
    renderHome();
    renderSettings();
    renderBedtime();
  }

  // ---------- Réglages ----------

  function normalizePhases() {
    const en = settings.phases.filter((p) => p.enabled);
    const dis = settings.phases.filter((p) => !p.enabled);
    settings.phases = en.concat(dis);
  }

  function renderSettings() {
    normalizePhases();
    const wrap = $('settingsList');
    wrap.innerHTML = '';

    const section = (label) => {
      const h = document.createElement('h3');
      h.className = 'sec';
      h.textContent = label;
      wrap.appendChild(h);
    };

    const enabled = settings.phases.filter((p) => p.enabled);
    section(t('myRitual'));
    enabled.forEach((p, i) => wrap.appendChild(settingsRow(p, i, enabled.length)));

    // Familles du réservoir : repliées par défaut pour garder l'écran court
    [['hyg', 'catHyg'], ['nuit', 'catNight'], ['calme', 'catCalm']].forEach(([cat, key]) => {
      const rest = settings.phases.filter((p) => !p.enabled && (p.cat || 'calme') === cat);
      if (!rest.length) return;
      const open = openCats.has(cat);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sec-btn' + (open ? ' open' : '');
      const chev = document.createElement('span');
      chev.className = 'chev';
      chev.textContent = '▶';
      const lbl = document.createElement('span');
      lbl.textContent = t(key);
      const count = document.createElement('span');
      count.className = 'count';
      count.textContent = String(rest.length);
      btn.append(chev, lbl, count);
      btn.addEventListener('click', () => {
        if (openCats.has(cat)) openCats.delete(cat); else openCats.add(cat);
        renderSettings();
      });
      wrap.appendChild(btn);
      if (blinkCat === cat) {
        blinkCat = null;
        btn.classList.add('blink');
        setTimeout(() => btn.classList.remove('blink'), 2200);
      }
      if (open) rest.forEach((p) => wrap.appendChild(settingsRow(p, -1, 0)));
    });

    $('soundToggle').checked = settings.soundOn;
    $('introToggle').checked = settings.introOn;
    $('settingsTotal').textContent = t('total').replace('{n}', totalMinutes());
  }

  function settingsRow(p, idx, nEnabled) {
    const row = document.createElement('div');
    row.className = 'srow' + (p.enabled ? '' : ' off');

    if (p.enabled) {
      const updown = document.createElement('div');
      updown.className = 'updown';
      updown.append(
        miniBtn('▲', idx === 0, () => movePhase(p, -1)),
        miniBtn('▼', idx === nEnabled - 1, () => movePhase(p, 1))
      );
      row.appendChild(updown);
    }

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = p.emoji + '  ' + phaseLabel(p);

    const dur = document.createElement('div');
    dur.className = 'dur';
    const val = document.createElement('b');
    val.textContent = p.minutes + ' ' + t('minUnit');
    dur.append(
      miniBtn('−', p.minutes <= 1, () => changeMinutes(p, -1)),
      val,
      miniBtn('+', p.minutes >= 60, () => changeMinutes(p, 1))
    );

    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.className = 'switch';
    toggle.checked = p.enabled;
    toggle.addEventListener('change', () => togglePhase(p, toggle));

    row.append(name, dur, toggle);
    return row;
  }

  function miniBtn(label, disabled, onTap) {
    const b = document.createElement('button');
    b.className = 'mini';
    b.textContent = label;
    b.disabled = disabled;
    b.addEventListener('click', onTap);
    return b;
  }

  function movePhase(p, dir) {
    normalizePhases();
    const arr = settings.phases;
    const i = arr.indexOf(p);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= arr.length || !arr[j].enabled) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    saveSettings();
    renderSettings();
    renderHome();
  }

  function changeMinutes(p, delta) {
    p.minutes = clampMin(p.minutes + delta);
    saveSettings();
    renderSettings();
    renderHome();
  }

  function togglePhase(p, input) {
    if (p.enabled && settings.phases.filter((x) => x.enabled).length === 1) {
      input.checked = true;
      toast(t('needOneStep'));
      return;
    }
    p.enabled = !p.enabled;
    if (p.enabled) {
      // L'étape activée rejoint la fin de « Mon rituel »
      const arr = settings.phases;
      arr.splice(arr.indexOf(p), 1);
      const lastEn = arr.reduce((acc, x, i) => (x.enabled ? i : acc), -1);
      arr.splice(lastEn + 1, 0, p);
    } else {
      // L'étape désactivée retourne dans sa famille : on la signale
      blinkCat = p.cat || 'calme';
    }
    normalizePhases();
    saveSettings();
    renderSettings();
    renderHome();
  }

  // ---------- Divers UI ----------

  function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.hidden = false;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => { el.hidden = true; }, 300);
    }, 2000);
  }

  function makeStars() {
    const wrap = $('stars');
    for (let i = 0; i < 36; i++) {
      const s = document.createElement('span');
      const size = 1 + Math.random() * 1.6;
      s.style.width = size + 'px';
      s.style.height = size + 'px';
      s.style.left = Math.random() * 100 + '%';
      s.style.top = Math.random() * 100 + '%';
      s.style.animationDuration = 1.8 + Math.random() * 2.4 + 's';
      s.style.animationDelay = -Math.random() * 4 + 's';
      wrap.appendChild(s);
    }
  }

  // ---------- Init ----------

  function init() {
    makeStars();

    $('btnStart').addEventListener('click', startRitual);
    $('btnSettings').addEventListener('click', () => { renderSettings(); showTab('steps'); showScreen('settings'); });
    $('tabSteps').addEventListener('click', () => showTab('steps'));
    $('tabApp').addEventListener('click', () => showTab('app'));
    $('btnBack').addEventListener('click', () => { renderHome(); showScreen('home'); });
    $('btnDefaults').addEventListener('click', () => {
      if (!confirm(t('defaultsConfirm'))) return;
      // Ne réinitialise que les étapes : langue, sons et animation sont conservés
      settings.phases = DEFAULT_PHASES.map((p) => ({ ...p }));
      saveSettings();
      renderSettings();
      renderHome();
      toast(t('defaultsDone'));
    });
    $('soundToggle').addEventListener('change', (e) => {
      settings.soundOn = e.target.checked;
      saveSettings();
    });
    $('introToggle').addEventListener('change', (e) => {
      settings.introOn = e.target.checked;
      saveSettings();
    });
    $('bedtimeInput').addEventListener('change', (e) => {
      if (!validBedtime(e.target.value)) { e.target.value = settings.bedtime; return; }
      settings.bedtime = e.target.value;
      saveSettings();
      renderBedtime();
      syncReminder(true);
    });
    $('reminderToggle').addEventListener('change', (e) => {
      settings.reminderOn = e.target.checked;
      saveSettings();
      renderBedtime();
      syncReminder(true);
      track('rappel_coucher', { actif: settings.reminderOn });
    });
    const sel = $('langSelect');
    Object.keys(I18N).forEach((code) => {
      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = I18N[code].name;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', () => {
      settings.lang = I18N[sel.value] ? sel.value : 'fr';
      saveSettings();
      applyLang();
      syncReminder(false);
      track('langue_changee', { langue: settings.lang });
    });
    $('intro').addEventListener('click', () => closeIntro(true));
    $('homeList').addEventListener('scroll', updateHomeFade);
    window.addEventListener('resize', () => {
      if (run) updateTrail();
      updateHomeFade();
    });
    $('btnPause').addEventListener('click', pauseToggle);
    $('btnPrev').addEventListener('click', prevPhase);
    $('btnSkip').addEventListener('click', skipPhase);
    $('btnStop').addEventListener('click', stopRitual);
    $('btnEndHome').addEventListener('click', () => { renderHome(); showScreen('home'); });

    // Forçage de langue par URL (?lang=en), utile pour les captures du store
    const urlLang = new URLSearchParams(location.search).get('lang');
    if (urlLang && I18N[urlLang]) settings.lang = urlLang;

    applyLang();
    syncReminder(false);

    if (!resumeFromStorage()) showScreen('home');

    if ('serviceWorker' in navigator && !['localhost', '127.0.0.1'].includes(location.hostname)) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }

    injectUmami();
    try {
      if (analyticsEnabled() && isStandalone() && !localStorage.getItem('dodo.appLaunched')) {
        localStorage.setItem('dodo.appLaunched', '1');
        setTimeout(() => track('app_installee'), 3000);
      }
    } catch {}

    const kofiS = $('kofiSettings');
    const kofiE = $('kofiEnd');
    if (KOFI_URL) {
      kofiS.href = KOFI_URL;
      kofiE.href = KOFI_URL;
      kofiS.hidden = false;
      kofiE.hidden = false;
    }
    kofiS.addEventListener('click', () => track('don_clic', { source: 'reglages' }));
    kofiE.addEventListener('click', () => track('don_clic', { source: 'fin' }));

    if (SPEED !== 1) {
      // Hook de test : permet de forcer un tick quand les timers sont étranglés
      window.__dodo = { tick: tickOnce, endFlip, closeIntro };
      console.log('[dodo] mode test : vitesse x' + SPEED);
    }
  }

  init();

})();
