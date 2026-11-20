/*
 * Speedtest Card for Home Assistant
 * https://github.com/juju35/ha-speedtest-card
 *
 * Lovelace cards for internet speed tests: a gauge of the download speed against your plan, the upload speed, the
 * ping and the jitter, a 7-day history from the recorder with your plan's line, the slowest test, and a button that
 * runs a test. The sensors come from Speedtest.net, Fast.com, iperf3, Ookla Speedtest, Speedtest Tracker or a Netgear router, found
 * through the entity and device registries; any download / upload / ping sensors can also be set in the
 * configuration.
 */

const VERSION = "__VERSION__";

const CARD_ICONS = {
  gauge:
    "M12,16A3,3 0 0,1 9,13C9,11.88 9.61,10.9 10.5,10.39L20.21,4.77L14.68,14.35C14.18,15.33 13.17,16 12,16M12,3C13.81,3 15.5,3.5 16.97,4.32L14.87,5.53C14,5.19 13,5 12,5A8,8 0 0,0 4,13C4,15.21 4.89,17.21 6.34,18.65H6.35C6.74,19.04 6.74,19.67 6.35,20.06C5.96,20.45 5.32,20.45 4.93,20.07V20.07C3.12,18.26 2,15.76 2,13A10,10 0 0,1 12,3M22,13C22,15.76 20.88,18.26 19.07,20.07V20.07C18.68,20.45 18.05,20.45 17.66,20.06C17.27,19.67 17.27,19.04 17.66,18.65V18.65C19.11,17.2 20,15.21 20,13C20,12 19.81,11 19.46,10.1L20.67,8C21.5,9.5 22,11.18 22,13Z",
  wifi: "M12,21L15.6,16.2C14.6,15.45 13.35,15 12,15C10.65,15 9.4,15.45 8.4,16.2L12,21M12,3C7.95,3 4.21,4.34 1.2,6.6L3,9C5.5,7.12 8.62,6 12,6C15.38,6 18.5,7.12 21,9L22.8,6.6C19.79,4.34 16.05,3 12,3M12,9C9.3,9 6.81,9.89 4.8,11.4L6.6,13.8C8.1,12.67 9.97,12 12,12C14.03,12 15.9,12.67 17.4,13.8L19.2,11.4C17.19,9.89 14.7,9 12,9Z",
  download: "M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z",
  upload: "M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z",
  ping: "M3,13H7L10,5L14,19L17,11H21V13H18.4L14,24L10,10L8.4,15H3V13Z",
  jitter: "M2,12H4L6,7L9,17L12,4L15,20L18,9L20,12H22",
  loss: "M12,2C17.5,2 22,6.5 22,12C22,17.5 17.5,22 12,22C6.5,22 2,17.5 2,12C2,6.5 6.5,2 12,2M12,4C10.1,4 8.4,4.6 7.1,5.7L18.3,16.9C19.3,15.5 20,13.8 20,12C20,7.6 16.4,4 12,4M16.9,18.3L5.7,7.1C4.6,8.4 4,10.1 4,12C4,16.4 7.6,20 12,20C13.9,20 15.6,19.4 16.9,18.3Z",
  server:
    "M4,1H20A1,1 0 0,1 21,2V6A1,1 0 0,1 20,7H4A1,1 0 0,1 3,6V2A1,1 0 0,1 4,1M4,9H20A1,1 0 0,1 21,10V14A1,1 0 0,1 20,15H4A1,1 0 0,1 3,14V10A1,1 0 0,1 4,9M4,17H20A1,1 0 0,1 21,18V22A1,1 0 0,1 20,23H4A1,1 0 0,1 3,22V18A1,1 0 0,1 4,17M9,5H10V3H9V5M9,13H10V11H9V13M9,21H10V19H9V21M5,3V5H7V3H5M5,11V13H7V11H5M5,19V21H7V19H5Z",
  chart: "M16,11.78L20.24,4.45L21.97,5.45L16.74,14.5L10.23,10.75L5.46,19H22V21H2V3H4V17.54L9.5,8L16,11.78Z",
  refresh: "M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z",
};

// Integrations whose speed tests are found on their own, the order they are preferred in, and how a test is run:
// [domain, service, data] for a service (data "download": the download sensor as entity_id), "update" (refresh the download sensor), or "button" (press the device's
// "run test" button).
const PLATFORMS = {
  speedtest_tracker: { name: "Speedtest Tracker", run: "button" },
  ookla_speedtest: { name: "Ookla Speedtest", run: ["ookla_speedtest", "run_speedtest", "download"] },
  speedtestdotnet: { name: "Speedtest.net", run: "update" },
  fastdotcom: { name: "Fast.com", run: "update" },
  iperf3: { name: "iperf3", run: ["iperf3", "speedtest", {}] },
  netgear: { name: "Netgear", run: "update" },
};
// How long the card says a test runs after it was started from the card, unless a new result comes earlier.
const TEST_MS = 90e3;

const STRINGS = {
  en: {
    of_plan: "{p}% of your plan",
    last_test: "Last test {when}",
    internet: "Internet speed",
    download: "Download",
    upload: "Upload",
    ping: "Ping",
    jitter: "Jitter",
    loss: "Packet loss",
    mbps: "Mbit/s",
    ms: "ms",
    testing: "Testing…",
    no_result: "No result",
    slow: "Slow",
    high_ping: "High latency",
    normal: "Normal",
    plan: "Plan {speed}",
    dip: "Slowest {speed} {when}",
    history: "History",
    last_days: "Last {n} days",
    loading: "Loading the history…",
    no_history: "No history yet",
    average: "Average ↓",
    slowest: "Slowest ↓",
    server: "Server",
    isp: "Provider",
    run_test: "Run a test",
    no_data: "No speed test found: install Speedtest.net, Fast.com, iperf3, Ookla Speedtest or Speedtest Tracker, or set the download sensor in the card.",
    download_field: "Download sensor (empty: automatic)",
    upload_field: "Upload sensor (optional)",
    ping_field: "Ping sensor (optional)",
    jitter_field: "Jitter sensor (optional)",
    device_field: "Device (empty: the first one found)",
    button: "Button that runs a test (optional)",
    plan_download: "Plan download (Mbit/s)",
    plan_upload: "Plan upload (Mbit/s)",
    history_days: "History (days)",
    alert_ratio: "Slow under this share of the plan or the median",
    ping_alert: "High latency from (ms)",
    show_history: "Show the history",
    show_stats: "Show average, slowest and server",
    show_run: "Show the run button",
    cancel: "Cancel",
    left: "{time} left",
    today_at: "today {time}",
    tomorrow_at: "tomorrow {time}",
    yesterday_at: "yesterday {time}",
    zoom_in: "Show details",
    zoom_out: "Show less",
    title: "Title (optional)",
    language: "Language",
    lang_auto: "Automatic",
    collapsed: "Sections folded by default",
    zoom: "Detail button",
    zoom_helper: "Switches the mini card to the full card's content",
    show_title: "Show title",
    show_subtitle: "Show subtitle",
    no_registry: "This card needs Home Assistant 2024.8 or later.",
    unavailable: "Unavailable",
    illustration: "Animated illustration",
    illustration_theme: "Illustration theme",
    theme_auto: "Automatic (follows the theme)",
    theme_day: "Day",
    theme_night: "Night",
  },
  fr: {
    of_plan: "{p} % de votre abonnement",
    last_test: "Dernier test {when}",
    internet: "Débit internet",
    download: "Réception",
    upload: "Envoi",
    ping: "Ping",
    jitter: "Gigue",
    loss: "Perte de paquets",
    mbps: "Mbit/s",
    ms: "ms",
    testing: "Test en cours…",
    no_result: "Pas de résultat",
    slow: "Lent",
    high_ping: "Latence élevée",
    normal: "Normal",
    plan: "Abonnement {speed}",
    dip: "Plus lent {speed} {when}",
    history: "Historique",
    last_days: "{n} derniers jours",
    loading: "Chargement de l'historique…",
    no_history: "Pas encore d'historique",
    average: "Moyenne ↓",
    slowest: "Plus lent ↓",
    server: "Serveur",
    isp: "Fournisseur",
    run_test: "Lancer un test",
    no_data: "Aucun test de débit trouvé : installez Speedtest.net, Fast.com, iperf3, Ookla Speedtest ou Speedtest Tracker, ou indiquez le capteur de réception dans la carte.",
    download_field: "Capteur de réception (vide : automatique)",
    upload_field: "Capteur d'envoi (facultatif)",
    ping_field: "Capteur de ping (facultatif)",
    jitter_field: "Capteur de gigue (facultatif)",
    device_field: "Appareil (vide : le premier trouvé)",
    button: "Bouton qui lance un test (facultatif)",
    plan_download: "Réception de l'abonnement (Mbit/s)",
    plan_upload: "Envoi de l'abonnement (Mbit/s)",
    history_days: "Historique (jours)",
    alert_ratio: "Lent sous cette part de l'abonnement ou de la médiane",
    ping_alert: "Latence élevée à partir de (ms)",
    show_history: "Afficher l'historique",
    show_stats: "Afficher moyenne, plus lent et serveur",
    show_run: "Afficher le bouton de test",
    cancel: "Annuler",
    left: "{time} restantes",
    today_at: "aujourd'hui {time}",
    tomorrow_at: "demain {time}",
    yesterday_at: "hier {time}",
    zoom_in: "Afficher les détails",
    zoom_out: "Réduire",
    title: "Titre (facultatif)",
    language: "Langue",
    lang_auto: "Automatique",
    collapsed: "Sections repliées par défaut",
    zoom: "Bouton détail",
    zoom_helper: "Bascule la mini-carte vers le contenu de la carte complète",
    show_title: "Afficher le titre",
    show_subtitle: "Afficher le sous-titre",
    no_registry: "Cette carte nécessite Home Assistant 2024.8 ou plus récent.",
    unavailable: "Indisponible",
    illustration: "Illustration animée",
    illustration_theme: "Thème de l’illustration",
    theme_auto: "Automatique (suit le thème)",
    theme_day: "Jour",
    theme_night: "Nuit",
  },
  de: {
    of_plan: "{p} % Ihres Tarifs",
    last_test: "Letzter Test {when}",
    internet: "Internetgeschwindigkeit",
    download: "Download",
    upload: "Upload",
    ping: "Ping",
    jitter: "Jitter",
    loss: "Paketverlust",
    mbps: "Mbit/s",
    ms: "ms",
    testing: "Test läuft…",
    no_result: "Kein Ergebnis",
    slow: "Langsam",
    high_ping: "Hohe Latenz",
    normal: "Normal",
    plan: "Tarif {speed}",
    dip: "Langsamster {speed} {when}",
    history: "Verlauf",
    last_days: "Letzte {n} Tage",
    loading: "Verlauf wird geladen…",
    no_history: "Noch kein Verlauf",
    average: "Durchschnitt ↓",
    slowest: "Langsamster ↓",
    server: "Server",
    isp: "Anbieter",
    run_test: "Test starten",
    no_data: "Kein Geschwindigkeitstest gefunden: Speedtest.net, Fast.com, iperf3, Ookla Speedtest oder Speedtest Tracker installieren oder den Download-Sensor in der Karte angeben.",
    download_field: "Download-Sensor (leer: automatisch)",
    upload_field: "Upload-Sensor (optional)",
    ping_field: "Ping-Sensor (optional)",
    jitter_field: "Jitter-Sensor (optional)",
    device_field: "Gerät (leer: das erste gefundene)",
    button: "Button, der einen Test startet (optional)",
    plan_download: "Download laut Tarif (Mbit/s)",
    plan_upload: "Upload laut Tarif (Mbit/s)",
    history_days: "Verlauf (Tage)",
    alert_ratio: "Langsam unter diesem Anteil des Tarifs oder des Medians",
    ping_alert: "Hohe Latenz ab (ms)",
    show_history: "Verlauf anzeigen",
    show_stats: "Durchschnitt, Langsamsten und Server anzeigen",
    show_run: "Test-Button anzeigen",
    cancel: "Abbrechen",
    left: "Noch {time}",
    today_at: "heute {time}",
    tomorrow_at: "morgen {time}",
    yesterday_at: "gestern {time}",
    zoom_in: "Details anzeigen",
    zoom_out: "Weniger anzeigen",
    title: "Titel (optional)",
    language: "Sprache",
    lang_auto: "Automatisch",
    collapsed: "Standardmäßig eingeklappte Bereiche",
    zoom: "Detail-Schaltfläche",
    zoom_helper: "Schaltet die Mini-Karte auf den Inhalt der vollen Karte um",
    show_title: "Titel anzeigen",
    show_subtitle: "Untertitel anzeigen",
    no_registry: "Diese Karte benötigt Home Assistant 2024.8 oder neuer.",
    unavailable: "Nicht verfügbar",
    illustration: "Animierte Illustration",
    illustration_theme: "Thema der Illustration",
    theme_auto: "Automatisch (folgt dem Design)",
    theme_day: "Tag",
    theme_night: "Nacht",
  },
  es: {
    of_plan: "{p} % de su contrato",
    last_test: "Última prueba {when}",
    internet: "Velocidad de internet",
    download: "Descarga",
    upload: "Subida",
    ping: "Ping",
    jitter: "Jitter",
    loss: "Pérdida de paquetes",
    mbps: "Mbit/s",
    ms: "ms",
    testing: "Probando…",
    no_result: "Sin resultado",
    slow: "Lenta",
    high_ping: "Latencia alta",
    normal: "Normal",
    plan: "Contrato {speed}",
    dip: "Más lenta {speed} {when}",
    history: "Historial",
    last_days: "Últimos {n} días",
    loading: "Cargando el historial…",
    no_history: "Aún sin historial",
    average: "Media ↓",
    slowest: "Más lenta ↓",
    server: "Servidor",
    isp: "Proveedor",
    run_test: "Hacer una prueba",
    no_data: "No se encontró ninguna prueba de velocidad: instale Speedtest.net, Fast.com, iperf3, Ookla Speedtest o Speedtest Tracker, o indique el sensor de descarga en la tarjeta.",
    download_field: "Sensor de descarga (vacío: automático)",
    upload_field: "Sensor de subida (opcional)",
    ping_field: "Sensor de ping (opcional)",
    jitter_field: "Sensor de jitter (opcional)",
    device_field: "Dispositivo (vacío: el primero encontrado)",
    button: "Botón que lanza una prueba (opcional)",
    plan_download: "Descarga contratada (Mbit/s)",
    plan_upload: "Subida contratada (Mbit/s)",
    history_days: "Historial (días)",
    alert_ratio: "Lenta por debajo de esta parte del contrato o de la mediana",
    ping_alert: "Latencia alta a partir de (ms)",
    show_history: "Mostrar el historial",
    show_stats: "Mostrar media, más lenta y servidor",
    show_run: "Mostrar el botón de prueba",
    cancel: "Cancelar",
    left: "Quedan {time}",
    today_at: "hoy {time}",
    tomorrow_at: "mañana {time}",
    yesterday_at: "ayer {time}",
    zoom_in: "Ver detalles",
    zoom_out: "Ver menos",
    title: "Título (opcional)",
    language: "Idioma",
    lang_auto: "Automático",
    collapsed: "Secciones plegadas por defecto",
    zoom: "Botón de detalle",
    zoom_helper: "Cambia la minitarjeta al contenido de la tarjeta completa",
    show_title: "Mostrar título",
    show_subtitle: "Mostrar subtítulo",
    no_registry: "Esta tarjeta necesita Home Assistant 2024.8 o posterior.",
    unavailable: "No disponible",
    illustration: "Ilustración animada",
    illustration_theme: "Tema de la ilustración",
    theme_auto: "Automático (sigue el tema)",
    theme_day: "Día",
    theme_night: "Noche",
  },
  it: {
    of_plan: "{p}% del tuo abbonamento",
    last_test: "Ultimo test {when}",
    internet: "Velocità internet",
    download: "Download",
    upload: "Upload",
    ping: "Ping",
    jitter: "Jitter",
    loss: "Perdita di pacchetti",
    mbps: "Mbit/s",
    ms: "ms",
    testing: "Test in corso…",
    no_result: "Nessun risultato",
    slow: "Lenta",
    high_ping: "Latenza alta",
    normal: "Normale",
    plan: "Abbonamento {speed}",
    dip: "Più lenta {speed} {when}",
    history: "Cronologia",
    last_days: "Ultimi {n} giorni",
    loading: "Caricamento della cronologia…",
    no_history: "Ancora nessuna cronologia",
    average: "Media ↓",
    slowest: "Più lenta ↓",
    server: "Server",
    isp: "Fornitore",
    run_test: "Avvia un test",
    no_data: "Nessun test di velocità trovato: installa Speedtest.net, Fast.com, iperf3, Ookla Speedtest o Speedtest Tracker, oppure indica il sensore di download nella scheda.",
    download_field: "Sensore di download (vuoto: automatico)",
    upload_field: "Sensore di upload (facoltativo)",
    ping_field: "Sensore di ping (facoltativo)",
    jitter_field: "Sensore di jitter (facoltativo)",
    device_field: "Dispositivo (vuoto: il primo trovato)",
    button: "Pulsante che avvia un test (facoltativo)",
    plan_download: "Download dell'abbonamento (Mbit/s)",
    plan_upload: "Upload dell'abbonamento (Mbit/s)",
    history_days: "Cronologia (giorni)",
    alert_ratio: "Lenta sotto questa quota dell'abbonamento o della mediana",
    ping_alert: "Latenza alta da (ms)",
    show_history: "Mostra la cronologia",
    show_stats: "Mostra media, più lenta e server",
    show_run: "Mostra il pulsante di test",
    cancel: "Annulla",
    left: "{time} rimanenti",
    today_at: "oggi {time}",
    tomorrow_at: "domani {time}",
    yesterday_at: "ieri {time}",
    zoom_in: "Mostra dettagli",
    zoom_out: "Mostra meno",
    title: "Titolo (facoltativo)",
    language: "Lingua",
    lang_auto: "Automatica",
    collapsed: "Sezioni chiuse per impostazione predefinita",
    zoom: "Pulsante dettagli",
    zoom_helper: "Passa la mini scheda al contenuto della scheda completa",
    show_title: "Mostra titolo",
    show_subtitle: "Mostra sottotitolo",
    no_registry: "Questa scheda richiede Home Assistant 2024.8 o successivo.",
    unavailable: "Non disponibile",
    illustration: "Illustrazione animata",
    illustration_theme: "Tema dell’illustrazione",
    theme_auto: "Automatico (segue il tema)",
    theme_day: "Giorno",
    theme_night: "Notte",
  },
  nl: {
    of_plan: "{p}% van uw abonnement",
    last_test: "Laatste test {when}",
    internet: "Internetsnelheid",
    download: "Download",
    upload: "Upload",
    ping: "Ping",
    jitter: "Jitter",
    loss: "Pakketverlies",
    mbps: "Mbit/s",
    ms: "ms",
    testing: "Bezig met testen…",
    no_result: "Geen resultaat",
    slow: "Traag",
    high_ping: "Hoge latentie",
    normal: "Normaal",
    plan: "Abonnement {speed}",
    dip: "Traagst {speed} {when}",
    history: "Geschiedenis",
    last_days: "Laatste {n} dagen",
    loading: "Geschiedenis laden…",
    no_history: "Nog geen geschiedenis",
    average: "Gemiddeld ↓",
    slowest: "Traagst ↓",
    server: "Server",
    isp: "Provider",
    run_test: "Test uitvoeren",
    no_data: "Geen snelheidstest gevonden: installeer Speedtest.net, Fast.com, iperf3, Ookla Speedtest of Speedtest Tracker, of geef de downloadsensor op in de kaart.",
    download_field: "Downloadsensor (leeg: automatisch)",
    upload_field: "Uploadsensor (optioneel)",
    ping_field: "Pingsensor (optioneel)",
    jitter_field: "Jittersensor (optioneel)",
    device_field: "Apparaat (leeg: het eerst gevonden)",
    button: "Knop die een test start (optioneel)",
    plan_download: "Download van het abonnement (Mbit/s)",
    plan_upload: "Upload van het abonnement (Mbit/s)",
    history_days: "Geschiedenis (dagen)",
    alert_ratio: "Traag onder dit deel van het abonnement of de mediaan",
    ping_alert: "Hoge latentie vanaf (ms)",
    show_history: "Geschiedenis tonen",
    show_stats: "Gemiddelde, traagste en server tonen",
    show_run: "Testknop tonen",
    cancel: "Annuleren",
    left: "Nog {time}",
    today_at: "vandaag {time}",
    tomorrow_at: "morgen {time}",
    yesterday_at: "gisteren {time}",
    zoom_in: "Details tonen",
    zoom_out: "Minder tonen",
    title: "Titel (optioneel)",
    language: "Taal",
    lang_auto: "Automatisch",
    collapsed: "Standaard ingeklapte secties",
    zoom: "Detailknop",
    zoom_helper: "Schakelt de minikaart naar de inhoud van de volledige kaart",
    show_title: "Titel tonen",
    show_subtitle: "Ondertitel tonen",
    no_registry: "Deze kaart vereist Home Assistant 2024.8 of nieuwer.",
    unavailable: "Niet beschikbaar",
    illustration: "Geanimeerde illustratie",
    illustration_theme: "Thema van de illustratie",
    theme_auto: "Automatisch (volgt het thema)",
    theme_day: "Dag",
    theme_night: "Nacht",
  },
  pt: {
    of_plan: "{p}% do seu plano",
    last_test: "Último teste {when}",
    internet: "Velocidade da internet",
    download: "Download",
    upload: "Upload",
    ping: "Ping",
    jitter: "Jitter",
    loss: "Perda de pacotes",
    mbps: "Mbit/s",
    ms: "ms",
    testing: "A testar…",
    no_result: "Sem resultado",
    slow: "Lenta",
    high_ping: "Latência alta",
    normal: "Normal",
    plan: "Tarifário {speed}",
    dip: "Mais lenta {speed} {when}",
    history: "Histórico",
    last_days: "Últimos {n} dias",
    loading: "A carregar o histórico…",
    no_history: "Ainda sem histórico",
    average: "Média ↓",
    slowest: "Mais lenta ↓",
    server: "Servidor",
    isp: "Operador",
    run_test: "Fazer um teste",
    no_data: "Nenhum teste de velocidade encontrado: instale Speedtest.net, Fast.com, iperf3, Ookla Speedtest ou Speedtest Tracker, ou indique o sensor de download no cartão.",
    download_field: "Sensor de download (vazio: automático)",
    upload_field: "Sensor de upload (opcional)",
    ping_field: "Sensor de ping (opcional)",
    jitter_field: "Sensor de jitter (opcional)",
    device_field: "Dispositivo (vazio: o primeiro encontrado)",
    button: "Botão que faz um teste (opcional)",
    plan_download: "Download do tarifário (Mbit/s)",
    plan_upload: "Upload do tarifário (Mbit/s)",
    history_days: "Histórico (dias)",
    alert_ratio: "Lenta abaixo desta parte do tarifário ou da mediana",
    ping_alert: "Latência alta a partir de (ms)",
    show_history: "Mostrar o histórico",
    show_stats: "Mostrar média, mais lenta e servidor",
    show_run: "Mostrar o botão de teste",
    cancel: "Cancelar",
    left: "Faltam {time}",
    today_at: "hoje {time}",
    tomorrow_at: "amanhã {time}",
    yesterday_at: "ontem {time}",
    zoom_in: "Mostrar detalhes",
    zoom_out: "Mostrar menos",
    title: "Título (opcional)",
    language: "Idioma",
    lang_auto: "Automático",
    collapsed: "Secções recolhidas por predefinição",
    zoom: "Botão de detalhe",
    zoom_helper: "Muda o minicartão para o conteúdo do cartão completo",
    show_title: "Mostrar título",
    show_subtitle: "Mostrar subtítulo",
    no_registry: "Este cartão requer o Home Assistant 2024.8 ou posterior.",
    unavailable: "Indisponível",
    illustration: "Ilustração animada",
    illustration_theme: "Tema da ilustração",
    theme_auto: "Automático (segue o tema)",
    theme_day: "Dia",
    theme_night: "Noite",
  },
  pl: {
    of_plan: "{p} % twojego planu",
    last_test: "Ostatni test {when}",
    internet: "Prędkość internetu",
    download: "Pobieranie",
    upload: "Wysyłanie",
    ping: "Ping",
    jitter: "Jitter",
    loss: "Utrata pakietów",
    mbps: "Mb/s",
    ms: "ms",
    testing: "Testowanie…",
    no_result: "Brak wyniku",
    slow: "Wolno",
    high_ping: "Wysokie opóźnienie",
    normal: "Normalnie",
    plan: "Abonament {speed}",
    dip: "Najwolniej {speed} {when}",
    history: "Historia",
    last_days: "Ostatnie {n} dni",
    loading: "Wczytywanie historii…",
    no_history: "Brak historii",
    average: "Średnio ↓",
    slowest: "Najwolniej ↓",
    server: "Serwer",
    isp: "Dostawca",
    run_test: "Uruchom test",
    no_data: "Nie znaleziono testu prędkości: zainstaluj Speedtest.net, Fast.com, iperf3, Ookla Speedtest lub Speedtest Tracker albo podaj czujnik pobierania w karcie.",
    download_field: "Czujnik pobierania (puste: automatycznie)",
    upload_field: "Czujnik wysyłania (opcjonalnie)",
    ping_field: "Czujnik pingu (opcjonalnie)",
    jitter_field: "Czujnik jittera (opcjonalnie)",
    device_field: "Urządzenie (puste: pierwsze znalezione)",
    button: "Przycisk uruchamiający test (opcjonalnie)",
    plan_download: "Pobieranie w abonamencie (Mb/s)",
    plan_upload: "Wysyłanie w abonamencie (Mb/s)",
    history_days: "Historia (dni)",
    alert_ratio: "Wolno poniżej tej części abonamentu lub mediany",
    ping_alert: "Wysokie opóźnienie od (ms)",
    show_history: "Pokaż historię",
    show_stats: "Pokaż średnią, najwolniejszy i serwer",
    show_run: "Pokaż przycisk testu",
    cancel: "Anuluj",
    left: "Pozostało {time}",
    today_at: "dziś {time}",
    tomorrow_at: "jutro {time}",
    yesterday_at: "wczoraj {time}",
    zoom_in: "Pokaż szczegóły",
    zoom_out: "Pokaż mniej",
    title: "Tytuł (opcjonalnie)",
    language: "Język",
    lang_auto: "Automatycznie",
    collapsed: "Sekcje domyślnie zwinięte",
    zoom: "Przycisk szczegółów",
    zoom_helper: "Przełącza minikartę na zawartość pełnej karty",
    show_title: "Pokaż tytuł",
    show_subtitle: "Pokaż podtytuł",
    no_registry: "Ta karta wymaga Home Assistant 2024.8 lub nowszego.",
    unavailable: "Niedostępne",
    illustration: "Animowana ilustracja",
    illustration_theme: "Motyw ilustracji",
    theme_auto: "Automatycznie (według motywu)",
    theme_day: "Dzień",
    theme_night: "Noc",
  },
  sr: {
    of_plan: "{p} % вашег пакета",
    last_test: "Последњи тест {when}",
    internet: "Брзина интернета",
    download: "Преузимање",
    upload: "Слање",
    ping: "Пинг",
    jitter: "Џитер",
    loss: "Губитак пакета",
    mbps: "Mbit/s",
    ms: "ms",
    testing: "Тестирање…",
    no_result: "Нема резултата",
    slow: "Споро",
    high_ping: "Велико кашњење",
    normal: "Нормално",
    plan: "Пакет {speed}",
    dip: "Најспорије {speed} {when}",
    history: "Историја",
    last_days: "Последњих {n} дана",
    loading: "Учитавање историје…",
    no_history: "Још нема историје",
    average: "Просек ↓",
    slowest: "Најспорије ↓",
    server: "Сервер",
    isp: "Провајдер",
    run_test: "Покрени тест",
    no_data: "Није пронађен тест брзине: инсталирајте Speedtest.net, Fast.com, iperf3, Ookla Speedtest или Speedtest Tracker, или унесите сензор преузимања у картицу.",
    download_field: "Сензор преузимања (празно: аутоматски)",
    upload_field: "Сензор слања (опционо)",
    ping_field: "Сензор пинга (опционо)",
    jitter_field: "Сензор џитера (опционо)",
    device_field: "Уређај (празно: први пронађени)",
    button: "Дугме које покреће тест (опционо)",
    plan_download: "Преузимање по пакету (Mbit/s)",
    plan_upload: "Слање по пакету (Mbit/s)",
    history_days: "Историја (дана)",
    alert_ratio: "Споро испод овог удела пакета или медијане",
    ping_alert: "Велико кашњење од (ms)",
    show_history: "Прикажи историју",
    show_stats: "Прикажи просек, најспорије и сервер",
    show_run: "Прикажи дугме за тест",
    cancel: "Откажи",
    left: "Преостало {time}",
    today_at: "данас {time}",
    tomorrow_at: "сутра {time}",
    yesterday_at: "јуче {time}",
    zoom_in: "Прикажи детаље",
    zoom_out: "Прикажи мање",
    title: "Наслов (опционо)",
    language: "Језик",
    lang_auto: "Аутоматски",
    collapsed: "Подразумевано скупљени одељци",
    zoom: "Дугме за детаље",
    zoom_helper: "Пребацује мини картицу на садржај пуне картице",
    show_title: "Прикажи наслов",
    show_subtitle: "Прикажи поднаслов",
    no_registry: "Ова картица захтева Home Assistant 2024.8 или новији.",
    unavailable: "Недоступно",
    illustration: "Анимирана илустрација",
    illustration_theme: "Тема илустрације",
    theme_auto: "Аутоматски (прати тему)",
    theme_day: "Дан",
    theme_night: "Ноћ",
  },
  "sr-Latn": {
    of_plan: "{p} % vašeg paketa",
    last_test: "Poslednji test {when}",
    internet: "Brzina interneta",
    download: "Preuzimanje",
    upload: "Slanje",
    ping: "Ping",
    jitter: "Džiter",
    loss: "Gubitak paketa",
    mbps: "Mbit/s",
    ms: "ms",
    testing: "Testiranje…",
    no_result: "Nema rezultata",
    slow: "Sporo",
    high_ping: "Veliko kašnjenje",
    normal: "Normalno",
    plan: "Paket {speed}",
    dip: "Najsporije {speed} {when}",
    history: "Istorija",
    last_days: "Poslednjih {n} dana",
    loading: "Učitavanje istorije…",
    no_history: "Još nema istorije",
    average: "Prosek ↓",
    slowest: "Najsporije ↓",
    server: "Server",
    isp: "Provajder",
    run_test: "Pokreni test",
    no_data: "Nije pronađen test brzine: instalirajte Speedtest.net, Fast.com, iperf3, Ookla Speedtest ili Speedtest Tracker, ili unesite senzor preuzimanja u karticu.",
    download_field: "Senzor preuzimanja (prazno: automatski)",
    upload_field: "Senzor slanja (opciono)",
    ping_field: "Senzor pinga (opciono)",
    jitter_field: "Senzor džitera (opciono)",
    device_field: "Uređaj (prazno: prvi pronađeni)",
    button: "Dugme koje pokreće test (opciono)",
    plan_download: "Preuzimanje po paketu (Mbit/s)",
    plan_upload: "Slanje po paketu (Mbit/s)",
    history_days: "Istorija (dana)",
    alert_ratio: "Sporo ispod ovog udela paketa ili medijane",
    ping_alert: "Veliko kašnjenje od (ms)",
    show_history: "Prikaži istoriju",
    show_stats: "Prikaži prosek, najsporije i server",
    show_run: "Prikaži dugme za test",
    cancel: "Otkaži",
    left: "Preostalo {time}",
    today_at: "danas {time}",
    tomorrow_at: "sutra {time}",
    yesterday_at: "juče {time}",
    zoom_in: "Prikaži detalje",
    zoom_out: "Prikaži manje",
    title: "Naslov (opciono)",
    language: "Jezik",
    lang_auto: "Automatski",
    collapsed: "Podrazumevano skupljeni odeljci",
    zoom: "Dugme za detalje",
    zoom_helper: "Prebacuje mini karticu na sadržaj pune kartice",
    show_title: "Prikaži naslov",
    show_subtitle: "Prikaži podnaslov",
    no_registry: "Ova kartica zahteva Home Assistant 2024.8 ili noviji.",
    unavailable: "Nedostupno",
    illustration: "Animirana ilustracija",
    illustration_theme: "Tema ilustracije",
    theme_auto: "Automatski (prati temu)",
    theme_day: "Dan",
    theme_night: "Noć",
  },
  ro: {
    of_plan: "{p} % din abonamentul dvs.",
    last_test: "Ultimul test {when}",
    internet: "Viteza internetului",
    download: "Descărcare",
    upload: "Încărcare",
    ping: "Ping",
    jitter: "Jitter",
    loss: "Pierdere de pachete",
    mbps: "Mbit/s",
    ms: "ms",
    testing: "Se testează…",
    no_result: "Niciun rezultat",
    slow: "Lent",
    high_ping: "Latență mare",
    normal: "Normal",
    plan: "Abonament {speed}",
    dip: "Cel mai lent {speed} {when}",
    history: "Istoric",
    last_days: "Ultimele {n} zile",
    loading: "Se încarcă istoricul…",
    no_history: "Încă fără istoric",
    average: "Medie ↓",
    slowest: "Cel mai lent ↓",
    server: "Server",
    isp: "Furnizor",
    run_test: "Rulează un test",
    no_data: "Niciun test de viteză găsit: instalați Speedtest.net, Fast.com, iperf3, Ookla Speedtest sau Speedtest Tracker sau indicați senzorul de descărcare în card.",
    download_field: "Senzor de descărcare (gol: automat)",
    upload_field: "Senzor de încărcare (opțional)",
    ping_field: "Senzor de ping (opțional)",
    jitter_field: "Senzor de jitter (opțional)",
    device_field: "Dispozitiv (gol: primul găsit)",
    button: "Buton care rulează un test (opțional)",
    plan_download: "Descărcare din abonament (Mbit/s)",
    plan_upload: "Încărcare din abonament (Mbit/s)",
    history_days: "Istoric (zile)",
    alert_ratio: "Lent sub această parte din abonament sau din mediană",
    ping_alert: "Latență mare de la (ms)",
    show_history: "Afișează istoricul",
    show_stats: "Afișează media, cel mai lent și serverul",
    show_run: "Afișează butonul de test",
    cancel: "Anulează",
    left: "Mai sunt {time}",
    today_at: "azi {time}",
    tomorrow_at: "mâine {time}",
    yesterday_at: "ieri {time}",
    zoom_in: "Arată detalii",
    zoom_out: "Arată mai puțin",
    title: "Titlu (opțional)",
    language: "Limbă",
    lang_auto: "Automat",
    collapsed: "Secțiuni pliate implicit",
    zoom: "Buton de detalii",
    zoom_helper: "Comută mini cardul la conținutul cardului complet",
    show_title: "Afișează titlul",
    show_subtitle: "Afișează subtitlul",
    no_registry: "Acest card necesită Home Assistant 2024.8 sau mai nou.",
    unavailable: "Indisponibil",
    illustration: "Ilustrație animată",
    illustration_theme: "Tema ilustrației",
    theme_auto: "Automat (urmează tema)",
    theme_day: "Zi",
    theme_night: "Noapte",
  },
  da: {
    of_plan: "{p} % af dit abonnement",
    last_test: "Seneste test {when}",
    internet: "Internethastighed",
    download: "Download",
    upload: "Upload",
    ping: "Ping",
    jitter: "Jitter",
    loss: "Pakketab",
    mbps: "Mbit/s",
    ms: "ms",
    testing: "Tester…",
    no_result: "Intet resultat",
    slow: "Langsom",
    high_ping: "Høj latenstid",
    normal: "Normal",
    plan: "Abonnement {speed}",
    dip: "Langsomst {speed} {when}",
    history: "Historik",
    last_days: "Sidste {n} dage",
    loading: "Indlæser historikken…",
    no_history: "Ingen historik endnu",
    average: "Gennemsnit ↓",
    slowest: "Langsomst ↓",
    server: "Server",
    isp: "Udbyder",
    run_test: "Kør en test",
    no_data: "Ingen hastighedstest fundet: installer Speedtest.net, Fast.com, iperf3, Ookla Speedtest eller Speedtest Tracker, eller angiv downloadsensoren i kortet.",
    download_field: "Downloadsensor (tom: automatisk)",
    upload_field: "Uploadsensor (valgfri)",
    ping_field: "Pingsensor (valgfri)",
    jitter_field: "Jittersensor (valgfri)",
    device_field: "Enhed (tom: den første fundne)",
    button: "Knap, der kører en test (valgfri)",
    plan_download: "Abonnementets download (Mbit/s)",
    plan_upload: "Abonnementets upload (Mbit/s)",
    history_days: "Historik (dage)",
    alert_ratio: "Langsom under denne andel af abonnementet eller medianen",
    ping_alert: "Høj latenstid fra (ms)",
    show_history: "Vis historikken",
    show_stats: "Vis gennemsnit, langsomst og server",
    show_run: "Vis testknappen",
    cancel: "Annuller",
    left: "{time} tilbage",
    today_at: "i dag {time}",
    tomorrow_at: "i morgen {time}",
    yesterday_at: "i går {time}",
    zoom_in: "Vis detaljer",
    zoom_out: "Vis mindre",
    title: "Titel (valgfri)",
    language: "Sprog",
    lang_auto: "Automatisk",
    collapsed: "Sektioner foldet sammen som standard",
    zoom: "Detaljeknap",
    zoom_helper: "Skifter minikortet til det fulde korts indhold",
    show_title: "Vis titel",
    show_subtitle: "Vis undertitel",
    no_registry: "Dette kort kræver Home Assistant 2024.8 eller nyere.",
    unavailable: "Utilgængelig",
    illustration: "Animeret illustration",
    illustration_theme: "Illustrationens tema",
    theme_auto: "Automatisk (følger temaet)",
    theme_day: "Dag",
    theme_night: "Nat",
  },
  sv: {
    of_plan: "{p} % av ditt abonnemang",
    last_test: "Senaste test {when}",
    internet: "Internethastighet",
    download: "Nedladdning",
    upload: "Uppladdning",
    ping: "Ping",
    jitter: "Jitter",
    loss: "Paketförlust",
    mbps: "Mbit/s",
    ms: "ms",
    testing: "Testar…",
    no_result: "Inget resultat",
    slow: "Långsam",
    high_ping: "Hög latens",
    normal: "Normal",
    plan: "Abonnemang {speed}",
    dip: "Långsammast {speed} {when}",
    history: "Historik",
    last_days: "Senaste {n} dagarna",
    loading: "Läser in historiken…",
    no_history: "Ingen historik än",
    average: "Medel ↓",
    slowest: "Långsammast ↓",
    server: "Server",
    isp: "Leverantör",
    run_test: "Kör ett test",
    no_data: "Inget hastighetstest hittades: installera Speedtest.net, Fast.com, iperf3, Ookla Speedtest eller Speedtest Tracker, eller ange nedladdningssensorn i kortet.",
    download_field: "Nedladdningssensor (tom: automatiskt)",
    upload_field: "Uppladdningssensor (valfri)",
    ping_field: "Pingsensor (valfri)",
    jitter_field: "Jittersensor (valfri)",
    device_field: "Enhet (tom: den första som hittas)",
    button: "Knapp som kör ett test (valfri)",
    plan_download: "Abonnemangets nedladdning (Mbit/s)",
    plan_upload: "Abonnemangets uppladdning (Mbit/s)",
    history_days: "Historik (dagar)",
    alert_ratio: "Långsam under denna andel av abonnemanget eller medianen",
    ping_alert: "Hög latens från (ms)",
    show_history: "Visa historiken",
    show_stats: "Visa medel, långsammast och server",
    show_run: "Visa testknappen",
    cancel: "Avbryt",
    left: "{time} kvar",
    today_at: "i dag {time}",
    tomorrow_at: "i morgon {time}",
    yesterday_at: "i går {time}",
    zoom_in: "Visa detaljer",
    zoom_out: "Visa mindre",
    title: "Titel (valfri)",
    language: "Språk",
    lang_auto: "Automatiskt",
    collapsed: "Sektioner hopfällda som standard",
    zoom: "Detaljknapp",
    zoom_helper: "Växlar minikortet till hela kortets innehåll",
    show_title: "Visa titel",
    show_subtitle: "Visa undertitel",
    no_registry: "Det här kortet kräver Home Assistant 2024.8 eller senare.",
    unavailable: "Otillgänglig",
    illustration: "Animerad illustration",
    illustration_theme: "Illustrationens tema",
    theme_auto: "Automatiskt (följer temat)",
    theme_day: "Dag",
    theme_night: "Natt",
  },
  bg: {
    of_plan: "{p} % от вашия план",
    last_test: "Последен тест {when}",
    internet: "Скорост на интернета",
    download: "Изтегляне",
    upload: "Качване",
    ping: "Пинг",
    jitter: "Джитър",
    loss: "Загуба на пакети",
    mbps: "Mbit/s",
    ms: "ms",
    testing: "Тества се…",
    no_result: "Няма резултат",
    slow: "Бавно",
    high_ping: "Висока латентност",
    normal: "Нормално",
    plan: "Абонамент {speed}",
    dip: "Най-бавно {speed} {when}",
    history: "История",
    last_days: "Последните {n} дни",
    loading: "Зареждане на историята…",
    no_history: "Все още няма история",
    average: "Средно ↓",
    slowest: "Най-бавно ↓",
    server: "Сървър",
    isp: "Доставчик",
    run_test: "Пусни тест",
    no_data: "Не е открит тест на скоростта: инсталирайте Speedtest.net, Fast.com, iperf3, Ookla Speedtest или Speedtest Tracker или посочете сензора за изтегляне в картата.",
    download_field: "Сензор за изтегляне (празно: автоматично)",
    upload_field: "Сензор за качване (по избор)",
    ping_field: "Сензор за пинг (по избор)",
    jitter_field: "Сензор за джитер (по избор)",
    device_field: "Устройство (празно: първото намерено)",
    button: "Бутон, който пуска тест (по избор)",
    plan_download: "Изтегляне по абонамент (Mbit/s)",
    plan_upload: "Качване по абонамент (Mbit/s)",
    history_days: "История (дни)",
    alert_ratio: "Бавно под този дял от абонамента или медианата",
    ping_alert: "Висока латентност от (ms)",
    show_history: "Показване на историята",
    show_stats: "Показване на средно, най-бавно и сървър",
    show_run: "Показване на бутона за тест",
    cancel: "Отказ",
    left: "Остават {time}",
    today_at: "днес {time}",
    tomorrow_at: "утре {time}",
    yesterday_at: "вчера {time}",
    zoom_in: "Покажи подробности",
    zoom_out: "Покажи по-малко",
    title: "Заглавие (по избор)",
    language: "Език",
    lang_auto: "Автоматично",
    collapsed: "Сгънати по подразбиране раздели",
    zoom: "Бутон за подробности",
    zoom_helper: "Превключва мини картата към съдържанието на пълната карта",
    show_title: "Покажи заглавие",
    show_subtitle: "Покажи подзаглавие",
    no_registry: "Тази карта изисква Home Assistant 2024.8 или по-нов.",
    unavailable: "Недостъпно",
    illustration: "Анимирана илюстрация",
    illustration_theme: "Тема на илюстрацията",
    theme_auto: "Автоматично (следва темата)",
    theme_day: "Ден",
    theme_night: "Нощ",
  },
  ru: {
    of_plan: "{p} % от вашего тарифа",
    last_test: "Последний тест {when}",
    internet: "Скорость интернета",
    download: "Загрузка",
    upload: "Отдача",
    ping: "Пинг",
    jitter: "Джиттер",
    loss: "Потеря пакетов",
    mbps: "Мбит/с",
    ms: "мс",
    testing: "Идёт тест…",
    no_result: "Нет результата",
    slow: "Медленно",
    high_ping: "Высокая задержка",
    normal: "Норма",
    plan: "Тариф {speed}",
    dip: "Медленнее всего {speed} {when}",
    history: "История",
    last_days: "Последние {n} дн.",
    loading: "Загрузка истории…",
    no_history: "Истории пока нет",
    average: "Среднее ↓",
    slowest: "Минимум ↓",
    server: "Сервер",
    isp: "Провайдер",
    run_test: "Запустить тест",
    no_data: "Тест скорости не найден: установите Speedtest.net, Fast.com, iperf3, Ookla Speedtest или Speedtest Tracker или укажите датчик загрузки в карточке.",
    download_field: "Датчик загрузки (пусто: автоматически)",
    upload_field: "Датчик отдачи (необязательно)",
    ping_field: "Датчик пинга (необязательно)",
    jitter_field: "Датчик джиттера (необязательно)",
    device_field: "Устройство (пусто: первое найденное)",
    button: "Кнопка запуска теста (необязательно)",
    plan_download: "Загрузка по тарифу (Мбит/с)",
    plan_upload: "Отдача по тарифу (Мбит/с)",
    history_days: "История (дней)",
    alert_ratio: "Медленно ниже этой доли тарифа или медианы",
    ping_alert: "Высокая задержка от (мс)",
    show_history: "Показывать историю",
    show_stats: "Показывать среднее, минимум и сервер",
    show_run: "Показывать кнопку теста",
    cancel: "Отмена",
    left: "Осталось {time}",
    today_at: "сегодня {time}",
    tomorrow_at: "завтра {time}",
    yesterday_at: "вчера {time}",
    zoom_in: "Показать подробности",
    zoom_out: "Свернуть",
    title: "Заголовок (необязательно)",
    language: "Язык",
    lang_auto: "Автоматически",
    collapsed: "Свёрнутые по умолчанию разделы",
    zoom: "Кнопка подробностей",
    zoom_helper: "Переключает мини-карточку на содержимое полной карточки",
    show_title: "Показывать заголовок",
    show_subtitle: "Показывать подзаголовок",
    no_registry: "Для этой карточки нужен Home Assistant 2024.8 или новее.",
    unavailable: "Недоступно",
    illustration: "Анимированная иллюстрация",
    illustration_theme: "Тема иллюстрации",
    theme_auto: "Автоматически (по теме)",
    theme_day: "День",
    theme_night: "Ночь",
  },
  uk: {
    of_plan: "{p} % від вашого тарифу",
    last_test: "Останній тест {when}",
    internet: "Швидкість інтернету",
    download: "Завантаження",
    upload: "Відвантаження",
    ping: "Пінг",
    jitter: "Джитер",
    loss: "Втрата пакетів",
    mbps: "Мбіт/с",
    ms: "мс",
    testing: "Триває тест…",
    no_result: "Немає результату",
    slow: "Повільно",
    high_ping: "Висока затримка",
    normal: "Норма",
    plan: "Тариф {speed}",
    dip: "Найповільніше {speed} {when}",
    history: "Історія",
    last_days: "Останні {n} дн.",
    loading: "Завантаження історії…",
    no_history: "Історії ще немає",
    average: "Середнє ↓",
    slowest: "Мінімум ↓",
    server: "Сервер",
    isp: "Провайдер",
    run_test: "Запустити тест",
    no_data: "Тест швидкості не знайдено: встановіть Speedtest.net, Fast.com, iperf3, Ookla Speedtest або Speedtest Tracker або вкажіть датчик завантаження в картці.",
    download_field: "Датчик завантаження (порожньо: автоматично)",
    upload_field: "Датчик відвантаження (необов'язково)",
    ping_field: "Датчик пінгу (необов'язково)",
    jitter_field: "Датчик джитера (необов'язково)",
    device_field: "Пристрій (порожньо: перший знайдений)",
    button: "Кнопка запуску тесту (необов'язково)",
    plan_download: "Завантаження за тарифом (Мбіт/с)",
    plan_upload: "Відвантаження за тарифом (Мбіт/с)",
    history_days: "Історія (днів)",
    alert_ratio: "Повільно нижче цієї частки тарифу або медіани",
    ping_alert: "Висока затримка від (мс)",
    show_history: "Показувати історію",
    show_stats: "Показувати середнє, мінімум і сервер",
    show_run: "Показувати кнопку тесту",
    cancel: "Скасувати",
    left: "Залишилось {time}",
    today_at: "сьогодні {time}",
    tomorrow_at: "завтра {time}",
    yesterday_at: "учора {time}",
    zoom_in: "Показати подробиці",
    zoom_out: "Згорнути",
    title: "Заголовок (необов'язково)",
    language: "Мова",
    lang_auto: "Автоматично",
    collapsed: "Згорнуті за замовчуванням розділи",
    zoom: "Кнопка подробиць",
    zoom_helper: "Перемикає міні-картку на вміст повної картки",
    show_title: "Показувати заголовок",
    show_subtitle: "Показувати підзаголовок",
    no_registry: "Для цієї картки потрібен Home Assistant 2024.8 або новіший.",
    unavailable: "Недоступно",
    illustration: "Анімована ілюстрація",
    illustration_theme: "Тема ілюстрації",
    theme_auto: "Автоматично (за темою)",
    theme_day: "День",
    theme_night: "Ніч",
  },
  hu: {
    of_plan: "Az előfizetés {p} %-a",
    last_test: "Utolsó mérés {when}",
    internet: "Internetsebesség",
    download: "Letöltés",
    upload: "Feltöltés",
    ping: "Ping",
    jitter: "Jitter",
    loss: "Csomagvesztés",
    mbps: "Mbit/s",
    ms: "ms",
    testing: "Mérés folyamatban…",
    no_result: "Nincs eredmény",
    slow: "Lassú",
    high_ping: "Magas késleltetés",
    normal: "Normál",
    plan: "Előfizetés {speed}",
    dip: "Leglassabb {speed} {when}",
    history: "Előzmények",
    last_days: "Az utolsó {n} nap",
    loading: "Előzmények betöltése…",
    no_history: "Még nincsenek előzmények",
    average: "Átlag ↓",
    slowest: "Leglassabb ↓",
    server: "Szerver",
    isp: "Szolgáltató",
    run_test: "Mérés indítása",
    no_data: "Nem található sebességmérés: telepítse a Speedtest.net, Fast.com, iperf3, Ookla Speedtest vagy Speedtest Tracker integrációt, vagy adja meg a letöltési érzékelőt a kártyán.",
    download_field: "Letöltési érzékelő (üres: automatikus)",
    upload_field: "Feltöltési érzékelő (opcionális)",
    ping_field: "Ping érzékelő (opcionális)",
    jitter_field: "Jitter érzékelő (opcionális)",
    device_field: "Eszköz (üres: az első talált)",
    button: "Mérést indító gomb (opcionális)",
    plan_download: "Előfizetett letöltés (Mbit/s)",
    plan_upload: "Előfizetett feltöltés (Mbit/s)",
    history_days: "Előzmények (nap)",
    alert_ratio: "Lassú az előfizetés vagy a medián ezen hányada alatt",
    ping_alert: "Magas késleltetés ettől (ms)",
    show_history: "Előzmények megjelenítése",
    show_stats: "Átlag, leglassabb és szerver megjelenítése",
    show_run: "Mérés gomb megjelenítése",
    cancel: "Mégse",
    left: "Még {time}",
    today_at: "ma {time}",
    tomorrow_at: "holnap {time}",
    yesterday_at: "tegnap {time}",
    zoom_in: "Részletek",
    zoom_out: "Kevesebb",
    title: "Cím (nem kötelező)",
    language: "Nyelv",
    lang_auto: "Automatikus",
    collapsed: "Alapértelmezetten összecsukott szakaszok",
    zoom: "Részletek gomb",
    zoom_helper: "A minikártyát a teljes kártya tartalmára váltja",
    show_title: "Cím megjelenítése",
    show_subtitle: "Alcím megjelenítése",
    no_registry: "Ehhez a kártyához Home Assistant 2024.8 vagy újabb szükséges.",
    unavailable: "Nem elérhető",
    illustration: "Animált illusztráció",
    illustration_theme: "Az illusztráció témája",
    theme_auto: "Automatikus (a témát követi)",
    theme_day: "Nappal",
    theme_night: "Éjszaka",
  },
  sk: {
    of_plan: "{p} % vášho programu",
    last_test: "Posledný test {when}",
    internet: "Rýchlosť internetu",
    download: "Sťahovanie",
    upload: "Odosielanie",
    ping: "Ping",
    jitter: "Jitter",
    loss: "Strata paketov",
    mbps: "Mb/s",
    ms: "ms",
    testing: "Testuje sa…",
    no_result: "Žiadny výsledok",
    slow: "Pomalé",
    high_ping: "Vysoká latencia",
    normal: "Normálne",
    plan: "Paušál {speed}",
    dip: "Najpomalšie {speed} {when}",
    history: "História",
    last_days: "Posledných {n} dní",
    loading: "Načítava sa história…",
    no_history: "Zatiaľ bez histórie",
    average: "Priemer ↓",
    slowest: "Najpomalšie ↓",
    server: "Server",
    isp: "Poskytovateľ",
    run_test: "Spustiť test",
    no_data: "Nenašiel sa žiadny test rýchlosti: nainštalujte Speedtest.net, Fast.com, iperf3, Ookla Speedtest alebo Speedtest Tracker, alebo zadajte senzor sťahovania v karte.",
    download_field: "Senzor sťahovania (prázdne: automaticky)",
    upload_field: "Senzor odosielania (voliteľné)",
    ping_field: "Senzor pingu (voliteľné)",
    jitter_field: "Senzor jitteru (voliteľné)",
    device_field: "Zariadenie (prázdne: prvé nájdené)",
    button: "Tlačidlo, ktoré spustí test (voliteľné)",
    plan_download: "Sťahovanie podľa paušálu (Mb/s)",
    plan_upload: "Odosielanie podľa paušálu (Mb/s)",
    history_days: "História (dni)",
    alert_ratio: "Pomalé pod týmto podielom paušálu alebo mediánu",
    ping_alert: "Vysoká latencia od (ms)",
    show_history: "Zobraziť históriu",
    show_stats: "Zobraziť priemer, najpomalšie a server",
    show_run: "Zobraziť tlačidlo testu",
    cancel: "Zrušiť",
    left: "Zostáva {time}",
    today_at: "dnes {time}",
    tomorrow_at: "zajtra {time}",
    yesterday_at: "včera {time}",
    zoom_in: "Zobraziť podrobnosti",
    zoom_out: "Zobraziť menej",
    title: "Názov (voliteľné)",
    language: "Jazyk",
    lang_auto: "Automaticky",
    collapsed: "Predvolene zbalené sekcie",
    zoom: "Tlačidlo podrobností",
    zoom_helper: "Prepne mini kartu na obsah úplnej karty",
    show_title: "Zobraziť názov",
    show_subtitle: "Zobraziť podnadpis",
    no_registry: "Táto karta vyžaduje Home Assistant 2024.8 alebo novší.",
    unavailable: "Nedostupné",
    illustration: "Animovaná ilustrácia",
    illustration_theme: "Téma ilustrácie",
    theme_auto: "Automaticky (podľa témy)",
    theme_day: "Deň",
    theme_night: "Noc",
  },
  cs: {
    of_plan: "{p} % vašeho tarifu",
    last_test: "Poslední test {when}",
    internet: "Rychlost internetu",
    download: "Stahování",
    upload: "Odesílání",
    ping: "Ping",
    jitter: "Jitter",
    loss: "Ztráta paketů",
    mbps: "Mb/s",
    ms: "ms",
    testing: "Probíhá test…",
    no_result: "Žádný výsledek",
    slow: "Pomalé",
    high_ping: "Vysoká latence",
    normal: "Normální",
    plan: "Tarif {speed}",
    dip: "Nejpomalejší {speed} {when}",
    history: "Historie",
    last_days: "Posledních {n} dní",
    loading: "Načítání historie…",
    no_history: "Zatím bez historie",
    average: "Průměr ↓",
    slowest: "Nejpomalejší ↓",
    server: "Server",
    isp: "Poskytovatel",
    run_test: "Spustit test",
    no_data: "Nebyl nalezen žádný test rychlosti: nainstalujte Speedtest.net, Fast.com, iperf3, Ookla Speedtest nebo Speedtest Tracker, nebo zadejte senzor stahování v kartě.",
    download_field: "Senzor stahování (prázdné: automaticky)",
    upload_field: "Senzor odesílání (volitelné)",
    ping_field: "Senzor pingu (volitelné)",
    jitter_field: "Senzor jitteru (volitelné)",
    device_field: "Zařízení (prázdné: první nalezené)",
    button: "Tlačítko, které spustí test (volitelné)",
    plan_download: "Stahování podle tarifu (Mb/s)",
    plan_upload: "Odesílání podle tarifu (Mb/s)",
    history_days: "Historie (dny)",
    alert_ratio: "Pomalé pod tímto podílem tarifu nebo mediánu",
    ping_alert: "Vysoká latence od (ms)",
    show_history: "Zobrazit historii",
    show_stats: "Zobrazit průměr, nejpomalejší a server",
    show_run: "Zobrazit tlačítko testu",
    cancel: "Zrušit",
    left: "Zbývá {time}",
    today_at: "dnes {time}",
    tomorrow_at: "zítra {time}",
    yesterday_at: "včera {time}",
    zoom_in: "Zobrazit podrobnosti",
    zoom_out: "Zobrazit méně",
    title: "Název (volitelné)",
    language: "Jazyk",
    lang_auto: "Automaticky",
    collapsed: "Ve výchozím stavu sbalené sekce",
    zoom: "Tlačítko podrobností",
    zoom_helper: "Přepne mini kartu na obsah plné karty",
    show_title: "Zobrazit název",
    show_subtitle: "Zobrazit podtitul",
    no_registry: "Tato karta vyžaduje Home Assistant 2024.8 nebo novější.",
    unavailable: "Nedostupné",
    illustration: "Animovaná ilustrace",
    illustration_theme: "Motiv ilustrace",
    theme_auto: "Automaticky (podle motivu)",
    theme_day: "Den",
    theme_night: "Noc",
  },
  sl: {
    of_plan: "{p} % vašega paketa",
    last_test: "Zadnji test {when}",
    internet: "Hitrost interneta",
    download: "Prenos",
    upload: "Nalaganje",
    ping: "Ping",
    jitter: "Jitter",
    loss: "Izguba paketov",
    mbps: "Mbit/s",
    ms: "ms",
    testing: "Testiranje…",
    no_result: "Ni rezultata",
    slow: "Počasno",
    high_ping: "Visoka zakasnitev",
    normal: "Normalno",
    plan: "Paket {speed}",
    dip: "Najpočasneje {speed} {when}",
    history: "Zgodovina",
    last_days: "Zadnjih {n} dni",
    loading: "Nalaganje zgodovine…",
    no_history: "Še ni zgodovine",
    average: "Povprečje ↓",
    slowest: "Najpočasneje ↓",
    server: "Strežnik",
    isp: "Ponudnik",
    run_test: "Zaženi test",
    no_data: "Ni najdenega testa hitrosti: namestite Speedtest.net, Fast.com, iperf3, Ookla Speedtest ali Speedtest Tracker ali vnesite senzor prenosa v kartico.",
    download_field: "Senzor prenosa (prazno: samodejno)",
    upload_field: "Senzor nalaganja (neobvezno)",
    ping_field: "Senzor pinga (neobvezno)",
    jitter_field: "Senzor trepetanja (neobvezno)",
    device_field: "Naprava (prazno: prva najdena)",
    button: "Gumb, ki zažene test (neobvezno)",
    plan_download: "Prenos po paketu (Mbit/s)",
    plan_upload: "Nalaganje po paketu (Mbit/s)",
    history_days: "Zgodovina (dni)",
    alert_ratio: "Počasno pod tem deležem paketa ali mediane",
    ping_alert: "Visoka zakasnitev od (ms)",
    show_history: "Prikaži zgodovino",
    show_stats: "Prikaži povprečje, najpočasneje in strežnik",
    show_run: "Prikaži gumb za test",
    cancel: "Prekliči",
    left: "Še {time}",
    today_at: "danes {time}",
    tomorrow_at: "jutri {time}",
    yesterday_at: "včeraj {time}",
    zoom_in: "Prikaži podrobnosti",
    zoom_out: "Prikaži manj",
    title: "Naslov (neobvezno)",
    language: "Jezik",
    lang_auto: "Samodejno",
    collapsed: "Privzeto strnjeni razdelki",
    zoom: "Gumb za podrobnosti",
    zoom_helper: "Preklopi mini kartico na vsebino polne kartice",
    show_title: "Prikaži naslov",
    show_subtitle: "Prikaži podnaslov",
    no_registry: "Ta kartica potrebuje Home Assistant 2024.8 ali novejši.",
    unavailable: "Ni na voljo",
    illustration: "Animirana ilustracija",
    illustration_theme: "Tema ilustracije",
    theme_auto: "Samodejno (sledi temi)",
    theme_day: "Dan",
    theme_night: "Noč",
  },
  lv: {
    of_plan: "{p} % no jūsu plāna",
    last_test: "Pēdējais tests {when}",
    internet: "Interneta ātrums",
    download: "Lejupielāde",
    upload: "Augšupielāde",
    ping: "Pings",
    jitter: "Džiters",
    loss: "Pakešu zudums",
    mbps: "Mbit/s",
    ms: "ms",
    testing: "Notiek tests…",
    no_result: "Nav rezultāta",
    slow: "Lēni",
    high_ping: "Liela aizture",
    normal: "Normāli",
    plan: "Plāns {speed}",
    dip: "Lēnākais {speed} {when}",
    history: "Vēsture",
    last_days: "Pēdējās {n} dienas",
    loading: "Ielādē vēsturi…",
    no_history: "Vēstures vēl nav",
    average: "Vidēji ↓",
    slowest: "Lēnākais ↓",
    server: "Serveris",
    isp: "Pakalpojumu sniedzējs",
    run_test: "Palaist testu",
    no_data: "Ātruma tests nav atrasts: instalējiet Speedtest.net, Fast.com, iperf3, Ookla Speedtest vai Speedtest Tracker vai norādiet lejupielādes sensoru kartītē.",
    download_field: "Lejupielādes sensors (tukšs: automātiski)",
    upload_field: "Augšupielādes sensors (neobligāts)",
    ping_field: "Pinga sensors (neobligāts)",
    jitter_field: "Džitera sensors (neobligāts)",
    device_field: "Ierīce (tukšs: pirmā atrastā)",
    button: "Poga, kas palaiž testu (neobligāta)",
    plan_download: "Plāna lejupielāde (Mbit/s)",
    plan_upload: "Plāna augšupielāde (Mbit/s)",
    history_days: "Vēsture (dienas)",
    alert_ratio: "Lēni zem šīs plāna vai mediānas daļas",
    ping_alert: "Liela aizture no (ms)",
    show_history: "Rādīt vēsturi",
    show_stats: "Rādīt vidējo, lēnāko un serveri",
    show_run: "Rādīt testa pogu",
    cancel: "Atcelt",
    left: "Atlikušas {time}",
    today_at: "šodien {time}",
    tomorrow_at: "rīt {time}",
    yesterday_at: "vakar {time}",
    zoom_in: "Rādīt detaļas",
    zoom_out: "Rādīt mazāk",
    title: "Virsraksts (neobligāts)",
    language: "Valoda",
    lang_auto: "Automātiski",
    collapsed: "Pēc noklusējuma sakļautās sadaļas",
    zoom: "Detaļu poga",
    zoom_helper: "Pārslēdz mini kartīti uz pilnās kartītes saturu",
    show_title: "Rādīt virsrakstu",
    show_subtitle: "Rādīt apakšvirsrakstu",
    no_registry: "Šai kartītei nepieciešams Home Assistant 2024.8 vai jaunāks.",
    unavailable: "Nav pieejams",
    illustration: "Animēta ilustrācija",
    illustration_theme: "Ilustrācijas motīvs",
    theme_auto: "Automātiski (seko tēmai)",
    theme_day: "Diena",
    theme_night: "Nakts",
  },
  el: {
    of_plan: "{p} % του πακέτου σας",
    last_test: "Τελευταία μέτρηση {when}",
    internet: "Ταχύτητα internet",
    download: "Λήψη",
    upload: "Αποστολή",
    ping: "Ping",
    jitter: "Jitter",
    loss: "Απώλεια πακέτων",
    mbps: "Mbit/s",
    ms: "ms",
    testing: "Δοκιμή σε εξέλιξη…",
    no_result: "Χωρίς αποτέλεσμα",
    slow: "Αργή",
    high_ping: "Υψηλή καθυστέρηση",
    normal: "Κανονική",
    plan: "Πρόγραμμα {speed}",
    dip: "Πιο αργή {speed} {when}",
    history: "Ιστορικό",
    last_days: "Τελευταίες {n} ημέρες",
    loading: "Φόρτωση ιστορικού…",
    no_history: "Δεν υπάρχει ακόμη ιστορικό",
    average: "Μέσος όρος ↓",
    slowest: "Πιο αργή ↓",
    server: "Διακομιστής",
    isp: "Πάροχος",
    run_test: "Εκτέλεση δοκιμής",
    no_data: "Δεν βρέθηκε δοκιμή ταχύτητας: εγκαταστήστε Speedtest.net, Fast.com, iperf3, Ookla Speedtest ή Speedtest Tracker ή ορίστε τον αισθητήρα λήψης στην κάρτα.",
    download_field: "Αισθητήρας λήψης (κενό: αυτόματα)",
    upload_field: "Αισθητήρας αποστολής (προαιρετικό)",
    ping_field: "Αισθητήρας ping (προαιρετικό)",
    jitter_field: "Αισθητήρας jitter (προαιρετικό)",
    device_field: "Συσκευή (κενό: η πρώτη που βρέθηκε)",
    button: "Κουμπί που εκτελεί δοκιμή (προαιρετικό)",
    plan_download: "Λήψη προγράμματος (Mbit/s)",
    plan_upload: "Αποστολή προγράμματος (Mbit/s)",
    history_days: "Ιστορικό (ημέρες)",
    alert_ratio: "Αργή κάτω από αυτό το ποσοστό του προγράμματος ή της διαμέσου",
    ping_alert: "Υψηλή καθυστέρηση από (ms)",
    show_history: "Εμφάνιση ιστορικού",
    show_stats: "Εμφάνιση μέσου όρου, πιο αργής και διακομιστή",
    show_run: "Εμφάνιση κουμπιού δοκιμής",
    cancel: "Ακύρωση",
    left: "Απομένουν {time}",
    today_at: "σήμερα {time}",
    tomorrow_at: "αύριο {time}",
    yesterday_at: "χθες {time}",
    zoom_in: "Εμφάνιση λεπτομερειών",
    zoom_out: "Εμφάνιση λιγότερων",
    title: "Τίτλος (προαιρετικό)",
    language: "Γλώσσα",
    lang_auto: "Αυτόματα",
    collapsed: "Ενότητες συμπτυγμένες από προεπιλογή",
    zoom: "Κουμπί λεπτομερειών",
    zoom_helper: "Αλλάζει τη μίνι κάρτα στο περιεχόμενο της πλήρους κάρτας",
    show_title: "Εμφάνιση τίτλου",
    show_subtitle: "Εμφάνιση υπότιτλου",
    no_registry: "Αυτή η κάρτα απαιτεί Home Assistant 2024.8 ή νεότερο.",
    unavailable: "Μη διαθέσιμο",
    illustration: "Κινούμενη εικονογράφηση",
    illustration_theme: "Θέμα εικονογράφησης",
    theme_auto: "Αυτόματο (ακολουθεί το θέμα)",
    theme_day: "Ημέρα",
    theme_night: "Νύχτα",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_ICONS = {
  chevron_down: "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",
  expand: "M10,21V19H6.41L10.91,14.5L9.5,13.09L5,17.59V14H3V21H10M14.5,10.91L19,6.41V10H21V3H14V5H17.59L13.09,9.5L14.5,10.91Z",
  collapse: "M19.5,3.09L15,7.59V4H13V11H20V9H16.41L20.91,4.5L19.5,3.09M4,13V15H7.59L3.09,19.5L4.5,20.91L9,16.41V20H11V13H4Z",
  alert: "M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20Z",
  plus: "M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z",
  minus: "M19,13H5V11H19V13Z",
  play: "M8,5.14V19.14L19,12.14L8,5.14Z",
  pause: "M14,19H18V5H14M6,19H10V5H6V19Z",
  stop: "M18,18H6V6H18V18Z",
  check: "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",
  close: "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z",
};
const ICONS = { ...BASE_ICONS, ...CARD_ICONS };

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const lang = (hass, config) => {
  const l = config?.language || (hass && (hass.locale?.language || hass.language)) || "en";
  return STRINGS[l] ? l : STRINGS[l.split("-")[0]] ? l.split("-")[0] : "en";
};

// Locale for Intl: the card's language, or Home Assistant's full locale when it has the same base (pt-BR, de-CH).
// A bare "pt" (Home Assistant's code for European Portuguese) becomes "pt-PT", otherwise Intl formats it the Brazilian way.
const intlLocale = (hass, config) => {
  const l = lang(hass, config);
  const src = config?.language || (hass && (hass.locale?.language || hass.language)) || "";
  const out = src && src.split("-")[0] === l.split("-")[0] ? src : l;
  return out === "pt" ? "pt-PT" : out;
};

const t = (hass, config, key, vars = {}) =>
  String(STRINGS[lang(hass, config)][key] ?? STRINGS.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

const valid = (s) => !!s && !["unknown", "unavailable", ""].includes(s.state);

const num = (s) => {
  if (!valid(s)) return null;
  const v = parseFloat(s.state);
  return Number.isFinite(v) ? v : null;
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
// Attributes of an element that opens an entity's more-info (nothing without an entity).
const moreInfo = (id) => (id ? ` role="button" tabindex="0" data-entity="${esc(id)}"` : "");
const svgIcon = (path, cls = "") => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
const domainOf = (id) => String(id || "").split(".")[0];
const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const DAY_MS = 8.64e7;


// "8:12", "1:05:00": a countdown, rounded up to the second.
const fmtCountdown = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
};

// A time stamp (ISO string, sensor state or input_datetime "YYYY-MM-DD HH:MM:SS") in ms; null otherwise.
const parseTime = (v) => {
  if (v === null || v === undefined || v === "" || v === "unknown" || v === "unavailable") return null;
  if (typeof v === "number") return v > 1e11 ? v : v * 1000;
  const s = String(v);
  const ms = Date.parse(/^\d{4}-\d{2}-\d{2} \d/.test(s) ? s.replace(" ", "T") : s);
  return Number.isFinite(ms) ? ms : null;
};

const startOfDay = (ms) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const fmtTime = (hass, config, ms) =>
  new Intl.DateTimeFormat(intlLocale(hass, config), { hour: "numeric", minute: "2-digit" }).format(new Date(ms));

// "today 18:00", "tomorrow 06:00", "yesterday 21:00", "Tue 06:00", "Jun 24, 06:00".
const fmtWhen = (hass, config, ms) => {
  const day = Math.round((startOfDay(ms) - startOfDay(Date.now())) / DAY_MS);
  const time = fmtTime(hass, config, ms);
  if (day === 0) return t(hass, config, "today_at", { time });
  if (day === 1) return t(hass, config, "tomorrow_at", { time });
  if (day === -1) return t(hass, config, "yesterday_at", { time });
  const locale = intlLocale(hass, config);
  if (Math.abs(day) < 7) return `${new Intl.DateTimeFormat(locale, { weekday: "short" }).format(new Date(ms))} ${time}`;
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(ms));
};

// "12 min ago", "in 3 h", "2 days ago": the largest unit that fits, rounded.
const fmtRelative = (hass, config, ms) => {
  const diff = ms - Date.now();
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(intlLocale(hass, config), { numeric: "auto", style: "short" });
  if (abs < 6e4) return rtf.format(0, "minute");
  if (abs < 3.6e6) return rtf.format(Math.round(diff / 6e4), "minute");
  if (abs < DAY_MS) return rtf.format(Math.round(diff / 3.6e6), "hour");
  return rtf.format(Math.round(diff / DAY_MS), "day");
};


// Registries: entries by device, names, areas.
const _byDevice = new WeakMap();
const byDevice = (hass) => {
  let map = _byDevice.get(hass.entities);
  if (map) return map;
  map = new Map();
  for (const e of Object.values(hass.entities || {})) {
    if (!e.device_id) continue;
    if (!map.has(e.device_id)) map.set(e.device_id, []);
    map.get(e.device_id).push(e);
  }
  _byDevice.set(hass.entities, map);
  return map;
};
const devName = (d) => d?.name_by_user || d?.name || "";
// What an entity is called, to recognise it: its id, translation key and names (registry and state), as snake_case.
const keyText = (e, hass) =>
  [e.entity_id, e.translation_key, e.name, hass.states[e.entity_id]?.attributes?.friendly_name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_");
// The entity of a device whose domain and text match (and that passes `test`).
const pick = (hass, list, domain, re, test = () => true) => list.find((e) => domainOf(e.entity_id) === domain && re.test(keyText(e, hass)) && test(e))?.entity_id;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const BASE_STYLE = `
  :host { --st-accent: #00897b; --st-ok: var(--success-color, #43a047); --st-warn: var(--warning-color, #ffa600);
          --st-crit: var(--error-color, #db4437); --st-idle: var(--disabled-text-color, #9e9e9e); --st-active: var(--info-color, #039be5);
          /* Text in a state color is mixed with the text color so that it reads at 4.5:1 at least. */
          --st-accent-text: color-mix(in srgb, var(--st-accent) 50%, var(--primary-text-color)); }
  ha-card { overflow: hidden; container: st-card / inline-size; }
  /* Natural width in a parent that sizes to its content (inline-block, grid "auto" column), without a minimum. */
  :host { display: block; min-width: 0; --st-natural-width: 380px; }
  :host::before { content: ""; display: grid; grid-template-columns: minmax(0, var(--st-natural-width)); height: 0; }
  .icon { width: 18px; height: 18px; fill: currentColor; flex: none; }
  .muted { color: var(--secondary-text-color); }
  .clickable { cursor: pointer; }
  [role="button"]:focus-visible { outline: 2px solid var(--primary-color, var(--st-accent)); outline-offset: 2px; border-radius: 4px; }
  .ok { --c: var(--st-ok); } .warn { --c: var(--st-warn); } .crit { --c: var(--st-crit); } .idle { --c: var(--st-idle); }
  .active { --c: var(--st-active); } .accent { --c: var(--st-accent); }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c, var(--st-ok)); flex: none; display: inline-block; }
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; white-space: nowrap;
          background: color-mix(in srgb, var(--c, var(--st-ok)) 15%, transparent); color: color-mix(in srgb, var(--c, var(--st-ok)) 50%, var(--primary-text-color));
          flex: none; box-sizing: border-box; }
  .chip-text { white-space: nowrap; }
  .header { display: flex; align-items: center; gap: 10px; padding: 12px 12px 0; }
  .header .zoom { align-self: flex-start; margin-top: 10px; }
  /* The status pill (classic header and banner): on the title row, 8 px after the title, only when the whole title
     and the pill's whole label fit there; otherwise on its own line under the subtitle, which then keeps one line.
     Its dot alone at 200 px or less, or when the banner has no room left for its label (pill-dot): the label stays
     in its title and for screen readers. Measured after each render (_fitPill), in every language, never by a fixed
     width. */
  .trow { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .trow .name { flex: 0 1 auto; min-width: 0; }
  .titles.pill-below .trow { display: contents; }
  .titles.pill-below .sub { order: 1; }
  .titles.pill-below .chip { order: 2; align-self: flex-start; margin-top: 2px; }
  .titles.pill-dot .chip { padding: 4px; }
  .titles.pill-dot .chip-text { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  .type-icon { position: relative; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex: none;
               --st-tint: var(--c, var(--st-accent)); background: color-mix(in srgb, var(--st-tint) 16%, transparent); transition: background-color .3s ease; }
  .type-icon .icon { width: 24px; height: 24px; fill: color-mix(in srgb, var(--st-tint) 60%, var(--primary-text-color)); transition: fill .3s ease; }
  .titles { flex: 1 1 0; min-width: 5ch; display: flex; flex-direction: column; }
  :host([hide-title]) .titles .name, :host([hide-subtitle]) .titles > .sub { display: none; }
  .name { font-size: 16px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .warning { padding: 16px; color: color-mix(in srgb, var(--st-warn) 50%, var(--primary-text-color)); }
  /* Buttons as on the other cards: a smoked-glass background (never a filled color), the icon in the accent color. */
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: none; cursor: pointer; font: inherit; font-size: 13px;
         font-weight: 500; padding: 6px 12px; border-radius: 18px; background: var(--secondary-background-color, rgba(127,127,127,.12));
         color: var(--primary-text-color); min-width: 0; }
  .btn span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .btn:not(:disabled):hover { background: color-mix(in srgb, var(--st-accent) 12%, var(--secondary-background-color, rgba(127,127,127,.12))); }
  .btn .icon { width: 18px; height: 18px; color: var(--st-accent); }
  .btn.primary { background: color-mix(in srgb, var(--st-accent) 16%, transparent); color: var(--st-accent-text); }
  .btn.primary:not(:disabled):hover { background: color-mix(in srgb, var(--st-accent) 24%, transparent); }
  .btn.active { background: color-mix(in srgb, var(--st-active) 16%, transparent); color: color-mix(in srgb, var(--st-active) 50%, var(--primary-text-color)); }
  .btn.active .icon { color: var(--st-active); }
  .btn.round { width: 36px; height: 36px; padding: 0; border-radius: 50%; flex: none; }
  .btn:disabled { opacity: .45; cursor: default; }
  .btn:focus-visible { outline: 2px solid var(--primary-color, var(--st-accent)); outline-offset: 2px; }
  .zoom { all: unset; flex: none; cursor: pointer; width: 24px; height: 24px; margin: -4px -4px -4px 0; border-radius: 50%;
          display: grid; place-items: center; color: var(--secondary-text-color); }
  .zoom .icon { width: 16px; height: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--st-idle) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--primary-color, var(--st-accent)); outline-offset: 1px; }
  .line { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--secondary-text-color); min-width: 0; }
  .line .icon { width: 16px; height: 16px; }
  .line span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .line.ok, .line.warn, .line.crit, .line.active, .line.accent { color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color)); }
  .line.ok .icon, .line.warn .icon, .line.crit .icon, .line.active .icon, .line.accent .icon { color: var(--c); }
  .info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
  .num { font-variant-numeric: tabular-nums; }
  .content { padding: 8px 12px 12px; display: flex; flex-direction: column; gap: 12px; }
  .section-title { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; text-transform: uppercase;
                   letter-spacing: .04em; color: var(--secondary-text-color); margin-bottom: 6px; }
  .section-title.toggle { cursor: pointer; user-select: none; }
  .section-title .icon { width: 16px; height: 16px; }
  .section-title span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .section-title .count { margin-left: 2px; text-transform: none; letter-spacing: 0; font-weight: 400; }
  .section-title.toggle[aria-expanded="false"] { margin-bottom: 0; }
  /* Folded: the chevron points right; unfolded: down. */
  .section-title .chevron { margin-left: auto; width: 16px; height: 16px; transition: transform .2s ease; }
  .section-title.toggle[aria-expanded="false"] .chevron { transform: rotate(-90deg); }
  .empty { font-size: 13px; color: var(--secondary-text-color); padding: 2px 0; }
  .ring-svg { position: absolute; inset: 0; transform: rotate(-90deg); }
  .ring-svg circle { fill: none; }
  .ring-svg .track { stroke: color-mix(in srgb, var(--c, var(--st-accent)) 18%, transparent); }
  .ring-svg .prog { stroke: var(--c, var(--st-accent)); stroke-linecap: round; transition: stroke-dashoffset 1s linear; }
  /* Hero, as on the garden and tempo cards: a flat illustration on the left, a big value and a few colored lines on the right. */
  .hero { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .hero-art { flex: none; width: 120px; display: grid; place-items: center; }
  .hero-art svg { width: 100%; height: auto; display: block; }
  .hero-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
  .hero-kick { font-size: 12px; color: var(--secondary-text-color); }
  .big { display: flex; align-items: baseline; gap: 6px; min-width: 0; }
  .big .icon { width: 24px; height: 24px; align-self: center; color: var(--c, var(--st-accent)); }
  .big b { font-size: 30px; font-weight: 400; line-height: 1; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .big span { font-size: 14px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .hero .line { font-size: 12.5px; }
  /* Rows, as the watering zones: a round icon (grey at rest, tinted otherwise, a ring while it runs), name, colored state, a button. */
  .row { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .row-icon { position: relative; width: 40px; height: 40px; border-radius: 50%; flex: none; display: grid; place-items: center;
              --t: var(--c, var(--st-idle)); background: color-mix(in srgb, var(--t) 18%, transparent); color: color-mix(in srgb, var(--t) 70%, var(--primary-text-color)); }
  .row-icon.idle { background: color-mix(in srgb, var(--primary-text-color) 8%, transparent); color: var(--secondary-text-color); }
  .row-icon > .icon, .row-icon > ha-icon { width: 22px; height: 22px; --mdc-icon-size: 22px; }
  .row-icon .ring-svg { inset: -2px; width: 44px; height: 44px; }
  .badge { position: absolute; right: -3px; bottom: -3px; width: 17px; height: 17px; border-radius: 50%; display: grid; place-items: center;
           background: var(--b, var(--st-ok)); color: #fff; box-shadow: 0 0 0 2px var(--ha-card-background, var(--card-background-color, #fff)); }
  .badge .icon { width: 11px; height: 11px; }
  .row-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
  .row-name { font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .row-state { font-size: 12.5px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .row-state.ok, .row-state.warn, .row-state.crit, .row-state.active, .row-state.accent { color: color-mix(in srgb, var(--c) 60%, var(--primary-text-color)); }
  .rows { display: flex; flex-direction: column; gap: 8px; }
  /* Tiles, as on room overview: grey, tinted with a border when they need a look; small badges below. */
  .tiles { display: grid; gap: 8px; grid-template-columns: repeat(var(--cols, 2), minmax(0, 1fr)); }
  .tile { min-width: 0; display: flex; flex-direction: column; gap: 6px; padding: 8px; border-radius: 10px; box-sizing: border-box;
          background: var(--secondary-background-color, rgba(127,127,127,.12)); border: 1px solid transparent; }
  .tile.tint { background: color-mix(in srgb, var(--c) 13%, var(--secondary-background-color, rgba(127,127,127,.12)));
               border-color: color-mix(in srgb, var(--c) 30%, transparent); }
  .tile-head { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .tile .row-icon { width: 30px; height: 30px; } .tile .row-icon > .icon { width: 18px; height: 18px; }
  .tile .row-state { font-size: 12px; }
  .badges { display: flex; gap: 4px; flex-wrap: wrap; }
  .pill { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; padding: 1px 7px; border-radius: 10px;
          color: color-mix(in srgb, var(--c, var(--st-idle)) 60%, var(--primary-text-color)); background: color-mix(in srgb, var(--c, var(--st-idle)) 14%, transparent); }
  .pill .icon { width: 14px; height: 14px; color: var(--c, var(--st-idle)); }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; animation: none !important; } }
  @container st-card (max-width: 230px) {
    .header { gap: 6px; }
  }
  @container st-card (max-width: 200px) {
    .chip { padding: 4px; }
    .chip-text { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  }
`;

// Popup at the top of the card, over a backdrop: it stays in view on a long card.
const DIALOG_STYLE = `
  ha-card.dialog-open { position: relative; min-height: 220px; }
  .backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: flex-start; justify-content: center;
              padding-top: 12px; box-sizing: border-box; z-index: 9; border-radius: inherit; }
  .modal { background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color); width: min(92%, 340px); max-height: calc(100% - 24px);
           box-sizing: border-box; border-radius: 14px; padding: 16px; box-shadow: 0 8px 30px rgba(0,0,0,.4); display: flex; flex-direction: column; gap: 12px; }
  .modal .msg { font-size: 15px; font-weight: 500; line-height: 1.3; overflow-wrap: anywhere; }
  .modal-actions { display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }
  .stepper { display: flex; align-items: center; justify-content: center; gap: 14px; }
  .stepper .val { font-size: 28px; font-weight: 400; min-width: 4ch; text-align: center; }
  .stepper .val small { font-size: 14px; color: var(--secondary-text-color); margin-left: 2px; }
  .presets { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
  .preset { font: inherit; font-size: 12px; padding: 4px 10px; border-radius: 14px; cursor: pointer; color: var(--primary-text-color);
            background: transparent; border: 1px solid color-mix(in srgb, var(--primary-text-color) 16%, transparent); }
  .preset.on { border-color: color-mix(in srgb, var(--st-accent) 60%, transparent); color: var(--st-accent-text); font-weight: 500;
               background: color-mix(in srgb, var(--st-accent) 10%, transparent); }
  .field { font: inherit; font-size: 15px; width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 10px; color: var(--primary-text-color);
           background: transparent; border: 1px solid color-mix(in srgb, var(--primary-text-color) 20%, transparent); }
  .field:focus { outline: 2px solid var(--primary-color, var(--st-accent)); outline-offset: -1px; }
`;

// The mini card: header and a compact row; its detail button switches it to the full card's content.
const MINI_STYLE = `
  :host { --st-natural-width: 300px; }
  .content.mini { flex-direction: row; align-items: center; gap: 12px; }
  .mini .info { gap: 4px; }
  .mini .line .icon { width: 14px; height: 14px; }
  .controls { display: flex; gap: 6px; flex: none; }
  @container (max-width: 300px) {
    .content.mini { flex-wrap: wrap; row-gap: 8px; }
    .mini .controls { flex-basis: 100%; justify-content: flex-end; }
  }
`;

// Element names of Home Assistant dialogs (a more-info opened from the card): a click there is not "elsewhere".
const DIALOG_TAGS = new Set(["HA-MORE-INFO-DIALOG", "HA-DIALOG", "DIALOG"]);
const isOutside = (card, ev) => {
  const path = ev.composedPath();
  return !path.includes(card) && !path.some((n) => DIALOG_TAGS.has(n.tagName));
};

// "A click elsewhere" is caught on the pointer, not only on the click event: on iOS (Safari and the companion app) a
// tap on something that is not clickable (the background, an empty spot, a card with no action) sends no click to the
// page. It counts when the press and the release are both outside the card (a slider dragged out of the card does not
// fold it), and a scroll does not count (the browser cancels the pointer). Keyboard clicks still go through the click
// event. `tap(ev)` (a press and a release at the same spot) is for the tests.
const watchOutside = (isOut, handler) => {
  let downOutside = false;
  const onDown = (ev) => {
    downOutside = isOut(ev);
  };
  const onUp = (ev) => {
    if (downOutside && isOut(ev)) handler(ev);
    downOutside = false;
  };
  const onClick = (ev) => {
    if (ev.detail === 0 && isOut(ev)) handler(ev);
  };
  return {
    on() {
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("pointerup", onUp, true);
      document.addEventListener("click", onClick, true);
    },
    tap(ev) {
      onDown(ev);
      onUp(ev);
    },
    off() {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("click", onClick, true);
    },
  };
};
// After a popup closes, clicks on the card are ignored this long (the second click of a double click).
const CONFIRM_GUARD_MS = 400;
// Elements a click acts on, and how one is told from the others across renders (focus kept for keyboard users).
const FOCUS_SELECTOR = "[data-action], [data-entity], [data-keep]";
const focusKey = (el) => {
  const data = Object.entries({ ...el.dataset });
  return data.length ? `${el.tagName}|${JSON.stringify(data)}` : "";
};

// ---------------------------------------------------------------------------
// Card base
// ---------------------------------------------------------------------------

// What every card of this file shares: rendering only when something shown changed, no rewrite under a press, focus
// kept for keyboard users, folding sections, a popup at the top of the card, live countdowns, service calls.
// A card defines _build() (its model from the registries and the configuration), _entityIds(m), _render(), and may
// define _action(action, el, ev), _dialogHtml() / _dialogAction(action, el), _extraDeps(), _onConnect() / _onDisconnect().
class CardBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._html = "";
    this._inputs = {};
    // No rewrite of the card between a press and its click: Home Assistant updates the card several times a second,
    // and a rewrite under the pointer replaces the element pressed, so that the click lands on the card itself and
    // does nothing. The update held back is drawn once released: by the click (registered before the card's own
    // handler, which renders at once), else right after the release.
    this._onPress = () => {
      this._byPointer = true;
      this._pressing = true;
      window.addEventListener("pointerup", this._onPressEnd, true);
      window.addEventListener("pointercancel", this._onPressEnd, true);
    };
    this._onPressEnd = () => {
      window.removeEventListener("pointerup", this._onPressEnd, true);
      window.removeEventListener("pointercancel", this._onPressEnd, true);
      setTimeout(() => {
        this._pressing = false;
        if (this._dirty) this._update();
      }, 0);
    };
    this._onPressClick = (ev) => {
      if (ev.detail === 0) this._byPointer = false;
      this._pressing = false;
    };
    this.shadowRoot.addEventListener("pointerdown", this._onPress);
    this.shadowRoot.addEventListener("click", this._onPressClick);
    // From the keyboard, the focus is kept across rewrites (with the pointer it would draw the focus ring).
    this.shadowRoot.addEventListener("keydown", () => {
      this._byPointer = false;
    });
    this.shadowRoot.addEventListener("click", (ev) => this._onClick(ev));
    // Text typed in a field of the card is kept across rewrites (see _update); Enter in it acts as its button.
    this.shadowRoot.addEventListener("input", (ev) => {
      const key = ev.target?.dataset?.keep;
      if (key) this._inputs[key] = ev.target.value;
    });
    this.shadowRoot.addEventListener("keydown", (ev) => {
      const el = ev.target;
      if (ev.key === "Enter" && el?.dataset?.keep && el.dataset.submit) {
        ev.preventDefault();
        this._onClick({ composedPath: () => [{ dataset: { action: el.dataset.submit } }], stopPropagation() {}, detail: 0 });
        return;
      }
      // Enter / Space on an element with the button role acts as a click, as on a <button>.
      if ((ev.key !== "Enter" && ev.key !== " ") || el?.getAttribute?.("role") !== "button") return;
      ev.preventDefault();
      el.click();
    });
    this._onKey = (ev) => {
      if (ev.key !== "Escape" || !this._dialog) return;
      ev.stopPropagation();
      this._closeDialog();
    };
  }

  static getStubConfig() {
    return {};
  }

  getCardSize() {
    return 6;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = { ...config };
    this.toggleAttribute?.("hide-title", config.show_title === false);
    this.toggleAttribute?.("hide-subtitle", config.show_subtitle === false);
    this._html = "";
    this._lastDeps = null;
    this._model = null;
    this._configChanged?.();
    this._update();
  }

  // Home Assistant pushes a new hass on every state change of the whole instance: the card is only rebuilt when
  // something it shows changed (see _deps).
  set hass(hass) {
    this._hass = hass;
    const deps = this._deps();
    const prev = this._lastDeps;
    if (deps && prev && deps.length === prev.length && deps.every((d, i) => d === prev[i])) return;
    this._lastDeps = deps;
    this._update();
  }

  get hass() {
    return this._hass;
  }

  // The registries, the language, the theme, the state objects the card reads, its own data and the minute (the
  // "12 min ago" texts move on their own).
  _deps() {
    const h = this._hass;
    if (!h || !this._config) return null;
    const m = this._resolve();
    const ids = m ? this._entityIds(m) : [];
    return [h.entities, h.devices, h.areas, h.language, h.locale, h.themes?.darkMode, Math.floor(Date.now() / 6e4), ...this._extraDeps(), ...ids.map((id) => h.states[id])];
  }

  _extraDeps() {
    return [];
  }

  // The model is rebuilt when the registries or the set of entities change (a new entity, a device renamed).
  _resolve() {
    const h = this._hass;
    if (!h?.entities || !h?.devices) return null;
    const key = [h.entities, h.devices, h.areas, Object.keys(h.states).length];
    if (this._model && this._modelKey?.every((k, i) => k === key[i])) return this._model;
    this._modelKey = key;
    this._model = this._build();
    return this._model;
  }

  connectedCallback() {
    // A click elsewhere on the page folds the sections back to their defaults and closes the popup.
    this._outside ??= watchOutside(
      (ev) => isOutside(this, ev),
      () => {
        if (!this._toggled?.size && !this._dialog) return;
        this._toggled = new Map();
        if (this._dialog) this._closeDialog();
        else this._update();
      },
    );
    this._outside.on();
    this._watchPill();
    if (this._dialog) window.addEventListener("keydown", this._onKey);
    clearInterval(this._tick);
    this._tick = setInterval(() => {
      if (this._hass) this.hass = this._hass;
    }, 60000);
    this._onConnect?.();
    this._update();
  }

  disconnectedCallback() {
    this._pressing = this._dirty = false;
    window.removeEventListener("pointerup", this._onPressEnd, true);
    window.removeEventListener("pointercancel", this._onPressEnd, true);
    clearInterval(this._tick);
    clearInterval(this._countdown);
    this._tick = this._countdown = null;
    this._outside?.off();
    this._unwatchPill();
    window.removeEventListener("keydown", this._onKey);
    this._onDisconnect?.();
    // Left (another dashboard view, a conditional card hidden): back to the defaults, so that the card does not come
    // back unfolded or with its popup open.
    this._toggled = new Map();
    this._dialog = null;
  }

  // The status pill goes on the title row, right after the title, only when the whole title and the pill's whole
  // label fit there; otherwise it takes its own line under the subtitle (the subtitle then on one line). In the
  // banner, when title, subtitle and pill still do not fit above the ground strip (or the pill's label runs past the
  // text, over the picture), the pill keeps its dot only.
  // Measured after each render and on every new width (or once the web font is loaded), never by a fixed width.
  _fitPill() {
    for (const t of this.shadowRoot?.querySelectorAll?.(".titles") || []) {
      const row = t.querySelector?.(".trow");
      const name = row?.querySelector(".name");
      const chips = row ? [...row.children].filter((n) => n.classList.contains("chip")) : [];
      if (!name?.getBoundingClientRect || !chips.length) continue;
      t.classList.remove("pill-below", "pill-dot");
      // The title's whole width (scrollWidth is rounded: 1 px more, so that a title that fits is never cut).
      const need = chips.reduce((w, c) => w + PILL_GAP_PX + c.getBoundingClientRect().width, name.scrollWidth + 1);
      if (need <= row.getBoundingClientRect().width + 0.5) continue;
      t.classList.add("pill-below");
      const banner = t.closest(".banner");
      if (!banner) continue;
      const box = banner.getBoundingClientRect();
      const ground = box.bottom - PILL_GROUND_PX;
      const right = t.getBoundingClientRect().right;
      const out = [name, ...t.querySelectorAll(".sub"), ...chips].some((n) => {
        const r = n.getBoundingClientRect();
        return r.height > 0 && (r.top < box.top - 0.5 || r.bottom > ground + 0.5 || r.right > right + 0.5);
      });
      if (out) t.classList.add("pill-dot");
    }
  }

  _watchPill() {
    if (typeof ResizeObserver !== "function") return;
    this._pillResize ??= new ResizeObserver((entries) => {
      const w = Math.round(entries.at(-1).contentRect.width);
      if (w === this._pillWidth) return;
      this._pillWidth = w;
      cancelAnimationFrame(this._pillFrame);
      this._pillFrame = requestAnimationFrame(() => this._fitPill());
    });
    this._pillResize.observe(this);
    document.fonts?.ready?.then(() => this._fitPill());
  }

  _unwatchPill() {
    this._pillResize?.disconnect();
    this._pillWidth = null;
  }

  _t(key, vars) {
    return t(this._hass, this._config, key, vars);
  }

  _locale() {
    return intlLocale(this._hass, this._config);
  }

  _s(id) {
    return id ? this._hass.states[id] : undefined;
  }

  // Service call whose failure Home Assistant already reports (toast): handled here so that it does not end up as
  // "Uncaught (in promise)".
  _call(domain, service, data) {
    const r = this._hass.callService(domain, service, data);
    if (r && typeof r.catch === "function") r.catch(() => {});
    return r;
  }

  // A websocket command, through hass.callWS (or the connection), resolved with null on error.
  async _ws(msg) {
    const h = this._hass;
    try {
      if (h.callWS) return await h.callWS(msg);
      if (h.connection?.sendMessagePromise) return await h.connection.sendMessagePromise(msg);
    } catch {
      return null;
    }
    return null;
  }

  _update() {
    if (!this._hass || !this._config) return;
    // Held back under a press (see the constructor): drawn once released.
    if (this._pressing) {
      this._dirty = true;
      return;
    }
    this._dirty = false;
    let html = this._render();
    if (this._dialog) {
      html = html.replace(/<ha-card(\s[^>]*)?>([\s\S]*)<\/ha-card>\s*$/, (_, attrs = "", inner) => {
        const a = attrs.includes('class="') ? attrs.replace('class="', 'class="dialog-open ') : `${attrs} class="dialog-open"`;
        return `<ha-card${a}>${inner}<style>${DIALOG_STYLE}</style>${this._dialogHtml()}</ha-card>`;
      });
    }
    if (html !== this._html) {
      const active = this.shadowRoot.activeElement;
      const field = active?.dataset?.keep ? { key: active.dataset.keep, start: active.selectionStart, end: active.selectionEnd } : null;
      const focused = this._dialog && active?.dataset?.action;
      const kept = this._dialog || this._byPointer ? null : this._focusedSpot();
      this._html = html;
      this.shadowRoot.innerHTML = html;
      this._fitPill();
      // Fields get back what was typed, and the caret when one had the focus.
      for (const el of this.shadowRoot.querySelectorAll?.("[data-keep]") || []) {
        const v = this._inputs[el.dataset.keep];
        if (v !== undefined) el.value = v;
      }
      if (field) {
        const el = this.shadowRoot.querySelector(`[data-keep="${field.key}"]`);
        el?.focus?.({ preventScroll: true });
        el?.setSelectionRange?.(field.start, field.end);
      } else if (kept) this._restoreFocus(kept);
      if (this._dialog && !field) {
        const sel = focused ? `.modal [data-action="${focused}"]` : ".modal [data-keep], .modal .primary";
        this.shadowRoot.querySelector(sel)?.focus?.({ preventScroll: true });
      }
    }
    this._syncCountdown();
    this._afterUpdate?.();
  }

  // Countdowns move every second in place (no re-render, which would restart the animations): the text of [data-end]
  // elements, and the arc of rings (data-total and data-c). The card is redrawn once a countdown ends.
  _syncCountdown() {
    const els = [...(this.shadowRoot.querySelectorAll?.("[data-end]") || [])];
    if (!els.length) {
      clearInterval(this._countdown);
      this._countdown = null;
      return;
    }
    if (this._countdown) return;
    this._countdown = setInterval(() => {
      const now = Date.now();
      let ended = false;
      for (const el of this.shadowRoot.querySelectorAll("[data-end]")) {
        const left = Number(el.dataset.end) - now;
        if (left <= 0) ended = true;
        if (el.dataset.total) {
          const offset = (Number(el.dataset.c) * (1 - clamp(left / Number(el.dataset.total), 0, 1))).toFixed(2);
          if (el.style.strokeDashoffset !== offset) el.style.strokeDashoffset = offset;
        } else {
          const text = el.dataset.fmt === "left" ? this._t("left", { time: fmtCountdown(left) }) : fmtCountdown(left);
          if (el.textContent !== text) el.textContent = text;
        }
      }
      if (ended) {
        clearInterval(this._countdown);
        this._countdown = null;
        this._lastDeps = null;
        this._update();
      }
    }, 1000);
  }

  _focusedSpot() {
    const el = this.shadowRoot.activeElement;
    if (!el?.dataset) return null;
    const key = focusKey(el);
    if (!key) return null;
    const index = this._focusables(key).indexOf(el);
    return index < 0 ? null : { key, index };
  }

  _focusables(key) {
    return [...this.shadowRoot.querySelectorAll(FOCUS_SELECTOR)].filter((n) => focusKey(n) === key);
  }

  _restoreFocus({ key, index }) {
    this._focusables(key)[index]?.focus({ preventScroll: true });
  }

  _onClick(ev) {
    const path = ev.composedPath();
    const el = path.find((n) => n.dataset && (n.dataset.entity || n.dataset.action));
    if (!this._dialog && Date.now() - (this._dialogClosedAt ?? 0) < CONFIRM_GUARD_MS) {
      ev.stopPropagation();
      return;
    }
    if (this._dialog) {
      ev.stopPropagation();
      const action = el?.dataset.action;
      if (action === "dialog_cancel" || (action === "dialog_backdrop" && path[0] === el)) return this._closeDialog();
      if (action) this._dialogAction(action, el);
      return;
    }
    if (!el) return;
    ev.stopPropagation();
    const { action, entity } = el.dataset;
    if (action === "zoom") return this._toggleZoom(ev);
    if (action === "toggle_section") {
      const key = el.dataset.section;
      this._toggled = new Map(this._toggled).set(key, !this._isCollapsed(key));
      return this._update();
    }
    if (action && this._action(action, el, ev)) return;
    if (entity) this._moreInfo(entity);
  }

  _moreInfo(entityId) {
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
  }

  _action() {
    return false;
  }

  _dialogAction() {}

  _dialogHtml() {
    return "";
  }

  _openDialog(d) {
    this._dialog = d;
    window.addEventListener("keydown", this._onKey);
    this._update();
    this.shadowRoot.querySelector(".modal [data-keep], .modal .primary")?.focus?.();
  }

  _closeDialog() {
    this._dialog = null;
    this._dialogClosedAt = Date.now();
    window.removeEventListener("keydown", this._onKey);
    this._update();
  }

  // The popup's frame: a message, the content and its buttons (cancel, then the main action).
  _modal(title, body, okLabel, okIcon, okDisabled = false) {
    return `<div class="backdrop" data-action="dialog_backdrop">
      <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="msg">${esc(title)}</div>
        ${body}
        <div class="modal-actions">
          <button class="btn" data-action="dialog_cancel"><span>${esc(this._t("cancel"))}</span></button>
          <button class="btn primary" data-action="dialog_ok"${okDisabled ? " disabled" : ""}>${okIcon ? svgIcon(okIcon) : ""}<span>${esc(okLabel)}</span></button>
        </div>
      </div>
    </div>`;
  }

  _isCollapsed(key) {
    if (this._toggled?.has(key)) return this._toggled.get(key);
    return asList(this._config.collapsed ?? this.constructor.defaultCollapsed ?? []).includes(key);
  }

  _sectionTitle(key, icon, label, count = "") {
    const closed = this._isCollapsed(key);
    return `<div class="section-title toggle" role="button" tabindex="0" data-action="toggle_section" data-section="${key}" aria-expanded="${!closed}">${svgIcon(icon)}<span>${esc(
      label,
    )}</span>${count !== "" ? `<span class="count">${esc(count)}</span>` : ""}${svgIcon(ICONS.chevron_down, "chevron")}</div>`;
  }

  // A folding section: its title, and its body unless folded.
  _section(key, icon, label, count, body) {
    return `<div class="section">${this._sectionTitle(key, icon, label, count)}${this._isCollapsed(key) ? "" : body}</div>`;
  }

  // The model ready to draw, or the error card to draw instead: no registries (Home Assistant too old), or nothing to
  // show (_emptyKey(m) names the message).
  _ready() {
    const m = this._resolve();
    if (!m) return { error: this._errorCard("no_registry") };
    const empty = this._emptyKey(m);
    return empty ? { error: this._errorCard(empty) } : { m };
  }

  _emptyKey() {
    return null;
  }

  _errorCard(key) {
    return `<style>${BASE_STYLE}</style><ha-card><div class="warning">${esc(this._t(key))}</div></ha-card>`;
  }

  // Header: the tinted round icon (its tint follows `cls`), the title and subtitle, the status chip on the title's line.
  _header({ icon, cls = "accent", title, sub, chip, extra = "" }) {
    return `
      <div class="header">
        <div class="type-icon ${cls}">${extra}${svgIcon(icon)}</div>
        <div class="titles">
          <div class="trow"><div class="name">${esc(title)}</div>${
            chip
              ? `<span class="chip ${chip.cls}${chip.entity ? " clickable" : ""}"${moreInfo(chip.entity)} title="${esc(chip.text)}" aria-label="${esc(
                  chip.text,
                )}"><span class="dot"></span><span class="chip-text">${esc(chip.text)}</span></span>`
              : ""
          }</div>
          ${sub ? `<div class="sub" title="${esc(sub)}">${esc(sub)}</div>` : ""}
        </div>
        ${this._zoomButton()}
      </div>`;
  }

  _zoomButton() {
    return "";
  }

  _toggleZoom() {}
}

// The mini card is the full card drawn compact: its detail button (top right, `zoom: false` removes it) switches it
// to the full card's content and back, and a click anywhere else on the page brings the compact view back.
const withMini = (Full) =>
  class extends Full {
    constructor() {
      super();
      this._unzoom = watchOutside(
        (ev) => isOutside(this, ev),
        () => {
          if (this._zoomed && !this._dialog) this._setZoom(false);
        },
      );
    }

    connectedCallback() {
      super.connectedCallback();
      this._unzoom.on();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this._unzoom.off();
      // Back to the compact view once off the screen (see the full card).
      this._zoomed = false;
    }

    getCardSize() {
      return this._zoomed ? super.getCardSize() : 3;
    }

    getGridOptions() {
      return { ...(this._zoomed ? super.getGridOptions() : { columns: 6, min_columns: 6 }), rows: "auto" };
    }

    _zoomButton() {
      if (this._config.zoom === false) return "";
      const z = this._zoomed;
      const label = esc(this._t(z ? "zoom_out" : "zoom_in"));
      return `<button class="zoom" data-action="zoom" title="${label}" aria-label="${label}">${svgIcon(z ? ICONS.collapse : ICONS.expand)}</button>`;
    }

    _setZoom(on) {
      this._zoomed = on;
      this._update();
      this.dispatchEvent(new CustomEvent("iron-resize", { bubbles: true, composed: true }));
    }

    _toggleZoom(ev) {
      this._setZoom(!this._zoomed);
      if (ev.detail === 0) this.shadowRoot.querySelector(".zoom")?.focus({ preventScroll: true });
    }

    _render() {
      return this._zoomed ? super._render() : this._renderMini();
    }
  };

// ---------------------------------------------------------------------------
// Visual editors (ha-form)
// ---------------------------------------------------------------------------

const LANGUAGES = [
  ["en", "English"],
  ["fr", "Français"],
  ["de", "Deutsch"],
  ["es", "Español"],
  ["sr", "Српски"],
  ["sr-Latn", "Srpski (latinica)"],
  ["it", "Italiano"],
  ["nl", "Nederlands"],
  ["pt", "Português (Portugal)"],
  ["pl", "Polski"],
  ["ro", "Română"],
  ["da", "Dansk"],
  ["sv", "Svenska"],
  ["bg", "Български"],
  ["ru", "Русский"],
  ["uk", "Українська"],
  ["hu", "Magyar"],
  ["sk", "Slovenčina"],
  ["cs", "Čeština"],
  ["sl", "Slovenščina"],
  ["lv", "Latviešu"],
  ["el", "Ελληνικά"],
];

// An editor is a ha-form: `fields` (the card's options), `toggles` ([name, default] booleans), `defaults` (options
// left out of the YAML when at their default), `sections` (the foldable sections, for `collapsed`). Options written
// in YAML that the form does not show are kept.
class EditorBase extends HTMLElement {
  static get toggles() {
    return [];
  }

  static get defaults() {
    return {};
  }

  static get sections() {
    return [];
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _fields() {
    return [];
  }

  _schema() {
    const tr = (k) => t(this._hass, this._config, k);
    const toggles = this.constructor.toggles;
    const sections = this.constructor.sections;
    return [
      { name: "title", selector: { text: {} } },
      ...this._fields(),
      ...(toggles.length ? [{ type: "grid", name: "", schema: toggles.map(([name]) => ({ name, selector: { boolean: {} } })) }] : []),
      ...(sections.length ? [{ name: "collapsed", selector: { select: { multiple: true, mode: "list", options: sections.map((value) => ({ value, label: tr(value) })) } } }] : []),
      { name: "language", selector: { select: { mode: "dropdown", options: [{ value: "", label: tr("lang_auto") }, ...LANGUAGES.map(([value, label]) => ({ value, label }))] } } },
    ];
  }

  _render() {
    if (!this._hass || !this._config) return;
    const toggles = this.constructor.toggles;
    const defaults = { ...Object.fromEntries(toggles), ...this.constructor.defaults };
    if (!this._form) {
      this._form = document.createElement("ha-form");
      // A field's label is its `<name>_field` text when the card also uses `<name>` for something else (a section).
      this._form.computeLabel = (s) => t(this._hass, this._config, STRINGS.en[`${s.name}_field`] ? `${s.name}_field` : s.name);
      this._form.computeHelper = (s) => (STRINGS.en[`${s.name}_helper`] ? t(this._hass, this._config, `${s.name}_helper`) : undefined);
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const config = { ...ev.detail.value };
        for (const [k, v] of Object.entries(config)) {
          // Keep the YAML minimal: no empty values, no options left at their default.
          if (v === "" || v === undefined || v === null || (Array.isArray(v) && !v.length) || (k in defaults && JSON.stringify(v) === JSON.stringify(defaults[k]))) delete config[k];
        }
        this._config = config;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    if (this._formConfig !== this._config) {
      this._formConfig = this._config;
      this._form.data = { ...defaults, ...this._config };
    }
    const l = lang(this._hass, this._config);
    if (this._schemaLang !== l) {
      this._schemaLang = l;
      this._form.schema = this._schema();
    }
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

const define = (name, cls) => {
  if (!customElements.get(name)) customElements.define(name, cls);
};

const register = (cards, url) => {
  for (const [name, cls] of cards) define(name, cls);
  window.customCards = window.customCards || [];
  for (const [type, , card] of cards) {
    if (card && !window.customCards.some((c) => c.type === type)) window.customCards.push({ type, ...card, preview: true, documentationURL: url });
  }
};

// ---------------------------------------------------------------------------
// Discovery
// ---------------------------------------------------------------------------

// A data rate in Mbit/s from a sensor, whatever Home Assistant data-rate unit it has: bits (bit/s, kbit/s, Mbit/s, Gbit/s),
// bytes (B/s, kB/s, MB/s, GB/s) or binary bytes (KiB/s, MiB/s, GiB/s). Units are compared in lower case.
const UNIT_MBPS = {
  "bit/s": 1e-6,
  "kbit/s": 1e-3,
  "mbit/s": 1,
  "gbit/s": 1e3,
  "b/s": 8e-6,
  "kb/s": 8e-3,
  "mb/s": 8,
  "gb/s": 8e3,
  "kib/s": (8 * 1024) / 1e6,
  "mib/s": (8 * 1024 ** 2) / 1e6,
  "gib/s": (8 * 1024 ** 3) / 1e6,
  mbps: 1,
  kbps: 1e-3,
  gbps: 1e3,
};
// The factor that turns a sensor's values into Mbit/s (1 for Mbit/s or an unknown unit).
const mbpsFactor = (s) => UNIT_MBPS[String(s?.attributes?.unit_of_measurement || "Mbit/s").toLowerCase()] ?? 1;
const toMbps = (s) => {
  const v = num(s);
  return v === null ? null : v * mbpsFactor(s);
};

// The sensors of a speed test among a list of registry entries: download, upload, ping, jitter, packet loss, server,
// ISP, time of the last test, and the button that runs a test.
const NOT_MAIN = /latency|jitter|avg|average|min|max|elapsed|bytes|percent|pct|iqm|low|high|total|today|yesterday|week|month/;
// Buttons of a device that are not a speed test (a router's restart, a firmware update…).
const NOT_RUN = /restart|reboot|firmware|update|reset|shutdown|power/;
const findSensors = (hass, list) => {
  const sensor = (re, not) => pick(hass, list, "sensor", re, (e) => !not?.test(keyText(e, hass)));
  return {
    // A Netgear router's speed test: downlink_bandwidth, uplink_bandwidth and average_ping, beside its traffic counters.
    download: sensor(/downlink_bandwidth/) ?? sensor(/download/, NOT_MAIN),
    upload: sensor(/uplink_bandwidth/) ?? sensor(/upload/, NOT_MAIN),
    ping: sensor(/average_ping/) ?? sensor(/ping|latency/, /download|upload|low|high|avg|average|min|max|jitter|iqm/),
    jitter: sensor(/jitter/, /download|upload/),
    loss: sensor(/packet_loss|loss/),
    server: sensor(/server/, /id$|_id_|host/),
    isp: sensor(/(^|_)isp(_|$)/),
    last: sensor(/last_test|last_result|last_run|date_last/),
    button: pick(hass, list, "button", /run|test|start|speedtest/, (e) => !NOT_RUN.test(keyText(e, hass))),
  };
};

const _cache = new WeakMap();

// The speed test of the configuration, else of the first supported integration found (or the configured device).
// Returns { platform, name, download, upload, ping, jitter, loss, server, isp, last, button } (entity ids).
const resolve = (hass, config) => {
  let per = _cache.get(hass.entities);
  if (!per) _cache.set(hass.entities, (per = new Map()));
  const sig = `${JSON.stringify([config.download, config.upload, config.ping, config.jitter, config.device, config.button])}|${Object.keys(hass.states).length}`;
  if (per.has(sig)) return per.get(sig);
  let out = null;
  if (config.download) {
    const e = hass.entities?.[config.download];
    const list = e?.device_id ? byDevice(hass).get(e.device_id) || [] : [];
    const found = findSensors(hass, list);
    out = {
      platform: e?.platform && PLATFORMS[e.platform] ? e.platform : null,
      download: config.download,
      upload: config.upload ?? found.upload ?? null,
      ping: config.ping ?? found.ping ?? null,
      jitter: config.jitter ?? found.jitter ?? null,
      loss: found.loss ?? null,
      server: found.server ?? null,
      isp: found.isp ?? null,
      last: found.last ?? null,
      button: config.button ?? found.button ?? null,
    };
  } else {
    const entries = Object.values(hass.entities || {});
    for (const platform of Object.keys(PLATFORMS)) {
      const mine = entries.filter((e) => e.platform === platform && hass.states[e.entity_id]);
      if (!mine.length) continue;
      // Grouped by device (iperf3 has none: its sensors, one host after the other).
      const groups = new Map();
      for (const e of mine) {
        const k = e.device_id || "none";
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(e);
      }
      // The first device with a download sensor: a router (Netgear) also has a device for each client it tracks.
      const want = config.device;
      for (const key of [...groups.keys()].filter((k) => !want || k === want || devName(hass.devices?.[k]) === want)) {
        const list = key === "none" ? groups.get(key) : byDevice(hass).get(key) || groups.get(key);
        const found = findSensors(hass, list);
        if (!found.download) continue;
        // Sensors set in the configuration win over the ones found, as with a configured download sensor.
        out = { platform, ...found, upload: config.upload ?? found.upload, ping: config.ping ?? found.ping, jitter: config.jitter ?? found.jitter, button: config.button ?? found.button };
        break;
      }
      if (out) break;
    }
  }
  if (out) out.name = out.platform ? PLATFORMS[out.platform].name : null;
  per.set(sig, out);
  return out;
};

// Points [{ t, v }] of an entity from a history/history_during_period answer (minimal or full response).
// Values are multiplied by `factor` (the sensor's unit in Mbit/s: the history has no attributes).
const historyPoints = (res, id, factor = 1) =>
  asList(res?.[id])
    .map((p) => ({ t: p.lu !== undefined ? p.lu * 1000 : parseTime(p.last_updated ?? p.last_changed), v: parseFloat(p.s ?? p.state) * factor }))
    .filter((p) => p.t !== null && Number.isFinite(p.v));

const median = (list) => {
  if (!list.length) return null;
  const s = [...list].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// A round top for a scale: 100, 200, 250, 500, 1000, 2500…
const niceMax = (v) => {
  if (!(v > 0)) return 100;
  const p = 10 ** Math.floor(Math.log10(v));
  return [1, 2, 2.5, 5, 10].map((k) => k * p).find((x) => x >= v);
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const SPEED_STYLE = `
  .hero-art.gauge { width: 120px; }
  .gauge .track { stroke: color-mix(in srgb, var(--primary-text-color) 12%, transparent); }
  .gauge .arc { stroke: var(--c, var(--st-accent)); transition: stroke-dashoffset .6s ease; }
  .gauge .mark { stroke: var(--secondary-text-color); }
  .gauge .needle { transform-box: view-box; transform-origin: 60px 70px; transition: transform .6s ease; }
  .gauge .needle line { stroke: var(--primary-text-color); opacity: .75; }
  .gauge .hub { fill: var(--primary-text-color); opacity: .75; }
  .gauge .box { fill: color-mix(in srgb, var(--primary-text-color) 7%, transparent); stroke: color-mix(in srgb, var(--primary-text-color) 22%, transparent); }
  .gauge .led { fill: var(--st-ok); } .gauge.testing .led.blink { fill: var(--st-warn); }
  .gauge.testing .arc { opacity: .35; }
  .gauge.testing .needle { animation: st-sweep 1.6s ease-in-out infinite alternate; }
  .gauge.testing .led.blink { animation: st-blink .8s steps(2, jump-none) infinite; }
  @keyframes st-sweep { from { transform: rotate(0deg); } to { transform: rotate(180deg); } }
  @keyframes st-blink { from { opacity: 1; } to { opacity: .2; } }
  .big.accent .icon { color: var(--st-accent); }
  .big.warn b, .big.crit b { color: color-mix(in srgb, var(--c) 60%, var(--primary-text-color)); }
  .chart svg { display: block; width: 100%; height: auto; overflow: visible; }
  .chart .dl { stroke: var(--st-accent); } .chart .area { fill: var(--st-accent); fill-opacity: .12; }
  .chart .ul { stroke: var(--st-active); }
  .chart .grid { stroke: var(--divider-color, rgba(127,127,127,.25)); }
  .chart .plan { stroke: var(--secondary-text-color); stroke-dasharray: 4 4; }
  .chart .dip { fill: var(--st-warn); }
  .chart text { fill: var(--secondary-text-color); font-size: 11px; font-family: inherit; }
  .xaxis { display: flex; justify-content: space-between; font-size: 11px; color: var(--secondary-text-color); margin-top: 4px; }
  .legend { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 12px; color: var(--secondary-text-color); margin-top: 6px; align-items: center; }
  .legend .k { display: inline-flex; align-items: center; gap: 6px; }
  .legend .sw { width: 14px; height: 3px; border-radius: 2px; background: var(--c); }
  .legend .dipnote { margin-left: auto; color: color-mix(in srgb, var(--st-warn) 60%, var(--primary-text-color)); display: inline-flex; gap: 4px; align-items: center; }
  .legend .dipnote .icon { width: 14px; height: 14px; color: var(--st-warn); }
  .tile .row-name small { font-size: 11px; font-weight: 400; color: var(--secondary-text-color); margin-left: 3px; }
  .foot { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .foot .note { font-size: 12px; color: var(--secondary-text-color); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .spin .icon { animation: st-spin 1s linear infinite; }
  @keyframes st-spin { to { transform: rotate(360deg); } }
  .mini .hero-art.gauge { width: 76px; }
  .mini .big b { font-size: 26px; }
  .banner.mini-banner { --st-scene-w: min(210px, 50cqw); }
  @container (max-width: 300px) {
    .hero { flex-direction: column; align-items: stretch; gap: 8px; }
    .hero-art.gauge { align-self: center; }
    .tiles { --cols: 1 !important; }
    .foot .note { display: none; }
    .legend .dipnote { margin-left: 0; }
  }
  @container (max-width: 200px) {
    .mini .hero-art.gauge { display: none; }
  }
`;

// ---------------------------------------------------------------------------
// Illustrated header
// ---------------------------------------------------------------------------

// The banner's picture, 240 × 80 at the right of the banner, standing on its 10 px lawn strip: the card's own gauge
// on the ground at the left (its box is the modem), a fibre line on poles over the hills down to a house, light
// pulses running along it (fast while a test runs, amber and sparse when the line is slow, none without a result).
// The left of the banner is sky: the title sits there. `uid` keeps each card's ids apart on a page.
const ST_STARS = [
  [12, 8],
  [44, 18],
  [96, 6],
  [132, 24],
  [178, 10],
  [222, 30],
  [70, 30],
  [204, 4],
];
const ST_LINE = "M56 74 Q70 66 92 36 Q117 46 142 36 Q167 46 192 36 Q204 44 212 58";
const stSceneSvg = (uid, gauge) => {
  const stars = ST_STARS.map(([x, y], i) => `<circle class="st-star${i % 3 ? "" : " tw"}" cx="${x}" cy="${y}" r=".7"/>`).join("");
  const poles = [92, 142, 192].map((x) => `<line x1="${x}" y1="78" x2="${x}" y2="34"/><line x1="${x - 4}" y1="36" x2="${x + 4}" y2="36"/>`).join("");
  return `<svg class="st-scene" viewBox="0 0 240 80" preserveAspectRatio="xMaxYMax meet" aria-hidden="true" focusable="false">
    <defs><radialGradient id="st-glow-${uid}"><stop offset="0" stop-color="#ffd27a" stop-opacity=".75"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>
    <g class="st-day"><circle class="st-sun halo" cx="160" cy="14" r="9"/><circle class="st-sun" cx="160" cy="14" r="6"/></g>
    <g class="st-night">${stars}<circle class="st-moon" cx="160" cy="14" r="5.5"/><circle class="st-moon-cut" cx="162.5" cy="12" r="4.5"/></g>
    <path class="st-hill far" d="M0 80C30 70 60 64 100 66C140 68 170 60 240 61V80Z"/>
    <path class="st-hill" d="M0 80C40 74 90 75 240 71V80Z"/>
    <g class="st-poles">${poles}</g>
    <path class="st-cable" d="${ST_LINE}"/>
    <path class="st-pulse" d="${ST_LINE}"/>
    <g class="st-house" transform="translate(208 52)">
      <circle class="st-glow" cx="8" cy="10" r="10" fill="url(#st-glow-${uid})"/>
      <rect class="st-wall" width="26" height="28"/><path class="st-roof" d="M-3 1L13-10L29 1Z"/>
      <rect class="st-win" x="4" y="7" width="7" height="6" rx=".6"/><rect class="st-door" x="15" y="15" width="7" height="13"/>
    </g>
    <svg class="st-gauge ${gauge.cls}" x="2" y="27.5" width="70" height="52.5" viewBox="8 18 104 78" overflow="visible">
      <path class="face" d="M8 70A52 52 0 0 1 112 70Z"/>${gauge.art}
    </svg>
  </svg>`;
};

// Night picture: forced by illustration_theme, else Home Assistant's dark theme alone (a light theme keeps the day
// picture after sunset).
const stIsNight = (hass, config) => {
  const theme = config?.illustration_theme;
  if (theme === "night") return true;
  if (theme === "day") return false;
  return !!hass?.themes?.darkMode;
};

// The banner's ground strip (the lawn), that the title block keeps clear of, and the gap between the title and the
// status pill on its row (.trow).
const PILL_GROUND_PX = 10;
const PILL_GAP_PX = 8;

const ST_BANNER_STYLE = `
  .banner { position: relative; overflow: hidden; height: 90px; color: #0d2a45; --st-scene-w: min(224px, 46cqw);
            background: linear-gradient(90deg, #f1f8ff 0%, #e2f1fd 34%, #b9def8 70%, #9fd0f3 100%); }
  .banner.night { color: #fff; background: linear-gradient(90deg, #1b2f52 0%, #15284a 36%, #0f1f3d 72%, #0a1830 100%); }
  /* The ground: a 10 px lawn strip under the whole banner, edge to edge. */
  .st-ground { position: absolute; left: 0; right: 0; bottom: 0; height: 10px; background: repeating-linear-gradient(90deg, #5aa83d 0 22px, #6cbb4c 22px 44px); }
  .night .st-ground { background: repeating-linear-gradient(90deg, #1f4a2a 0 22px, #245433 22px 44px); }
  .st-scene { position: absolute; right: 0; bottom: 10px; width: var(--st-scene-w); height: 80px; overflow: visible; }
  .htext { position: absolute; left: 12px; top: 0; bottom: 10px; right: calc(var(--st-scene-w) + 4px); display: flex; align-items: center; gap: 10px; min-width: 0; }
  /* Title row: the title, then the status pill 8 px after it (in the icon's colour, see .trow); the subtitle under. */
  .htext .titles { flex: 1 1 auto; min-width: 0; justify-content: center; gap: 1px; }
  .banner .name { font-weight: 600; }
  .banner .sub { color: #3b5b78; }
  .banner.night .sub { color: rgba(255,255,255,.78); }
  /* The round icon on the sky, tinted by the status: accent when all is well, blue while testing, amber when slow, red without a result. */
  .banner .type-icon { background: rgba(255,255,255,.62); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--st-tint) 25%, transparent); }
  .banner .type-icon .icon { fill: color-mix(in srgb, var(--st-tint) 82%, #0d2a45); }
  .banner.night .type-icon { background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); }
  .banner.night .type-icon .icon { fill: color-mix(in srgb, var(--st-tint) 62%, #fff); }
  .banner .chip { line-height: 16px;
                  background: color-mix(in srgb, var(--c) 18%, rgba(255,255,255,.78)); color: color-mix(in srgb, var(--c) 45%, #0d2a45); }
  .banner.night .chip { background: color-mix(in srgb, var(--c) 30%, rgba(8,18,38,.55)); color: color-mix(in srgb, var(--c) 35%, #ffffff); }
  .banner .chip .dot { width: 7px; height: 7px; }
  /* The expand / collapse button: 24 px, round, frosted, in the banner's top right corner. */
  .banner .zoom { position: absolute; z-index: 2; top: 5px; right: 5px; width: 24px; height: 24px; margin: 0; color: #33506b;
                  background: rgba(255,255,255,.55); box-shadow: inset 0 0 0 1px rgba(255,255,255,.7);
                  -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); }
  .banner .zoom:hover { background: rgba(255,255,255,.75); color: #33506b; }
  .banner.night .zoom { color: #fff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
  .banner.night .zoom:hover { background: rgba(255,255,255,.22); color: #fff; }
  .st-night, .night .st-day { display: none; }
  .night .st-night { display: inline; }
  .st-sun { fill: #ffd65a; } .st-sun.halo { opacity: .28; }
  .st-star { fill: #fff; opacity: .8; } .st-star.tw { animation: st-twinkle 3.2s ease-in-out infinite alternate; }
  .st-moon { fill: #f3eed2; } .st-moon-cut { fill: #13254a; }
  .st-hill { fill: #86c27f; } .st-hill.far { fill: #a7d39f; }
  .night .st-hill { fill: #17303d; } .night .st-hill.far { fill: #1d3a4a; }
  .st-poles { stroke: #8a939c; stroke-width: 1.2; } .night .st-poles { stroke: #7d8793; }
  .st-cable { stroke: #5f6b7a; stroke-width: 1.6; fill: none; } .night .st-cable { stroke: #4a5568; }
  .st-pulse { stroke: #2fd0ff; stroke-width: 1.8; fill: none; stroke-linecap: round; stroke-dasharray: 4 26; animation: st-pulse 1.4s linear infinite; }
  .st-testing .st-pulse { stroke-dasharray: 6 12; animation-duration: .6s; }
  .st-warn .st-pulse { stroke: #ffb02e; stroke-dasharray: 3 45; animation-duration: 3.2s; }
  .st-crit .st-pulse { display: none; }
  .st-crit .st-cable { stroke-dasharray: 3 3; }
  .st-wall { fill: #f3e6d3; } .night .st-wall { fill: #2a3646; }
  .st-roof { fill: #c0603a; } .night .st-roof { fill: #3a2a2a; }
  .st-win { fill: #86b9de; } .night .st-win { fill: #ffcf6e; }
  .st-door { fill: #8a5a3a; }
  .st-glow { display: none; } .night .st-glow { display: inline; }
  /* The gauge on the ground keeps the card's drawing, inked for the sky behind it. */
  .st-gauge { --primary-text-color: #1d3550; --secondary-text-color: #4a6680; }
  .night .st-gauge { --primary-text-color: #e8eef6; --secondary-text-color: #a9b8c8; }
  .st-gauge .face { fill: rgba(255,255,255,.55); } .night .st-gauge .face { fill: rgba(255,255,255,.08); }
  .st-gauge .box { fill: #eef2f6; } .night .st-gauge .box { fill: #2c3a4e; }
  /* The gauge sits in the banner: the hero shows its text alone, unless the card is too narrow for the picture. */
  .banner ~ .content .hero-art.gauge { display: none; }
  @keyframes st-pulse { to { stroke-dashoffset: -30; } }
  @keyframes st-twinkle { from { opacity: .3; } to { opacity: .9; } }
  @container (max-width: 300px) {
    .st-scene { display: none; }
    .htext { right: 36px; }
    .banner ~ .content .hero-art.gauge { display: grid; }
  }
  @container (max-width: 200px) {
    .banner ~ .content.mini .hero-art.gauge { display: none; }
  }
`;

let _stUid = 0;

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

class SpeedtestCard extends CardBase {
  static getConfigElement() {
    return document.createElement("speedtest-card-editor");
  }

  getCardSize() {
    return 7;
  }

  _build() {
    return resolve(this._hass, this._config);
  }

  _resolve() {
    const r = super._resolve();
    return r === null && this._hass?.entities ? false : r;
  }

  _ready() {
    const m = this._resolve();
    if (m === null) return { error: this._errorCard("no_registry") };
    if (!m) return { error: this._errorCard("no_data") };
    return { m };
  }

  _entityIds(m) {
    return m ? [m.download, m.upload, m.ping, m.jitter, m.loss, m.server, m.isp, m.last].filter(Boolean) : [];
  }

  _extraDeps() {
    return [this._history, this._testing];
  }

  _onConnect() {
    this._histKey = null;
  }

  _configChanged() {
    this._history = undefined;
    this._histKey = null;
  }

  _afterUpdate() {
    this._fetchHistory();
  }

  // The history of the download and upload sensors over `history_days` (7): fetched once, again after each new
  // result (and every hour).
  _fetchHistory() {
    const m = this._resolve();
    if (!m || (this._config.show_history === false && this._config.show_stats === false)) return;
    const days = Number(this._config.history_days) || 7;
    const st = this._s(m.download);
    const key = `${m.download}|${st?.last_updated}|${days}|${Math.floor(Date.now() / 3.6e6)}`;
    if (key === this._histKey) return;
    this._histKey = key;
    const end = Date.now();
    this._ws({
      type: "history/history_during_period",
      start_time: new Date(end - days * DAY_MS).toISOString(),
      end_time: new Date(end).toISOString(),
      entity_ids: [m.download, m.upload].filter(Boolean),
      minimal_response: true,
      no_attributes: true,
      significant_changes_only: false,
    }).then((res) => {
      if (!res) return;
      // In Mbit/s, as the current values (a sensor in kbit/s, MB/s or MiB/s would otherwise skew the chart and the median).
      const dl = historyPoints(res, m.download, mbpsFactor(this._s(m.download)));
      this._history = { dl, ul: m.upload ? historyPoints(res, m.upload, mbpsFactor(this._s(m.upload))) : [], days };
      this._lastDeps = null;
      this._update();
    });
  }

  // A speed shown: whole Mbit/s from 100, one decimal under.
  _speed(v) {
    if (v === null || v === undefined) return "—";
    return new Intl.NumberFormat(this._locale(), { maximumFractionDigits: v < 100 ? 1 : 0 }).format(v);
  }

  _ms(v) {
    return v === null || v === undefined ? "—" : new Intl.NumberFormat(this._locale(), { maximumFractionDigits: v < 10 ? 1 : 0 }).format(v);
  }

  _summary(m) {
    const c = this._config;
    const dl = toMbps(this._s(m.download));
    const ul = m.upload ? toMbps(this._s(m.upload)) : null;
    const ping = m.ping ? num(this._s(m.ping)) : null;
    const jitter = m.jitter ? num(this._s(m.jitter)) : null;
    const loss = m.loss ? num(this._s(m.loss)) : null;
    const pts = this._history?.dl || [];
    const plan = Number(c.plan_download) || null;
    const planUl = Number(c.plan_upload) || null;
    const reference = plan || median(pts.map((p) => p.v));
    const ratio = Number(c.alert_ratio) || 0.5;
    const testing = this._testing && Date.now() - this._testing < TEST_MS;
    const last = (m.last && parseTime(this._s(m.last)?.state)) || parseTime(this._s(m.download)?.last_updated);
    let status;
    if (testing) status = { cls: "active", text: this._t("testing") };
    else if (dl === null) status = { cls: "crit", text: this._t("no_result"), entity: m.download };
    else if (reference && dl < reference * ratio) status = { cls: "warn", text: this._t("slow"), entity: m.download };
    else if (ping !== null && ping > (Number(c.ping_alert) || 100)) status = { cls: "warn", text: this._t("high_ping"), entity: m.ping };
    else status = { cls: "ok", text: this._t("normal") };
    const max = plan || niceMax(Math.max(dl ?? 0, ...pts.map((p) => p.v)) * 1.05);
    return { dl, ul, ping, jitter, loss, plan, planUl, reference, ratio, status, testing, last, max };
  }

  _subtitle(m, sum) {
    const parts = [];
    if (m.name) parts.push(m.name);
    if (sum.last) parts.push(fmtRelative(this._hass, this._config, sum.last));
    return parts.join(" · ");
  }

  // The header: the illustrated banner (title, subtitle and status chip on its sky, the scene at its right), or
  // the classic header with `illustration: false`.
  _head(sum, sub) {
    const cls = sum.status.cls === "ok" ? "accent" : sum.status.cls;
    const title = this._config.title || this._t("internet");
    if (this._config.illustration === false) return this._header({ icon: ICONS.gauge, cls, title, sub, chip: sum.status });
    this._uid ??= ++_stUid;
    const chip = sum.status;
    const scene = stSceneSvg(this._uid, { cls: this._gaugeCls(sum), art: this._gaugeArt(sum) });
    return `<div class="banner${this._renderMini && !this._zoomed ? " mini-banner" : ""} st-${sum.testing ? "testing" : sum.status.cls}${stIsNight(this._hass, this._config) ? " night" : ""}">
        ${scene}<div class="st-ground" aria-hidden="true"></div>
        <div class="htext">
          <div class="type-icon ${cls}">${svgIcon(ICONS.wifi)}</div>
          <div class="titles">
            <div class="trow"><div class="name">${esc(title)}</div><span class="chip ${cls}${chip.entity ? " clickable" : ""}"${moreInfo(chip.entity)} title="${esc(chip.text)}" aria-label="${esc(chip.text)}"><span class="dot"></span><span class="chip-text">${esc(chip.text)}</span></span></div>
            ${sub ? `<div class="sub" title="${esc(sub)}">${esc(sub)}</div>` : ""}
          </div>
        </div>
        ${this._zoomButton()}
      </div>`;
  }

  _styles() {
    return this._config.illustration === false ? "" : ST_BANNER_STYLE;
  }

  // The gauge, a flat illustration: the download speed on a half dial with the plan's mark, a needle on it (it sweeps
  // the dial while a test runs) and a box whose light blinks during the test.
  _gaugeCls(sum) {
    const cls = sum.status.cls === "warn" || sum.status.cls === "crit" ? sum.status.cls : "accent";
    return `gauge ${cls}${sum.testing ? " testing" : ""}`;
  }

  // The dial's drawing, in a 120 × 100 box: in the hero, and on the banner's ground.
  _gaugeArt(sum) {
    const r = 44;
    const len = Math.PI * r;
    const p = sum.dl === null ? 0 : clamp(sum.dl / sum.max, 0, 1);
    const pt = (f, rr) => [60 - rr * Math.cos(Math.PI * f), 70 - rr * Math.sin(Math.PI * f)].map((v) => v.toFixed(1));
    const mark = sum.plan && sum.plan < sum.max ? (() => { const f = clamp(sum.plan / sum.max, 0, 1); const [x1, y1] = pt(f, r - 8); const [x2, y2] = pt(f, r + 8); return `<line class="mark" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="2"/>`; })() : "";
    const deg = sum.testing ? 0 : p * 180;
    return `<path class="track" d="M16 70 A${r} ${r} 0 0 1 104 70" fill="none" stroke-width="10" stroke-linecap="round"/>
        <path class="arc" d="M16 70 A${r} ${r} 0 0 1 104 70" fill="none" stroke-width="10" stroke-linecap="round" stroke-dasharray="${len.toFixed(1)}" style="stroke-dashoffset:${(len * (1 - p)).toFixed(1)}"/>
        ${mark}
        <g class="needle" style="transform: rotate(${deg.toFixed(1)}deg)"><line x1="60" y1="70" x2="26" y2="70" stroke-width="4" stroke-linecap="round"/></g>
        <circle class="hub" cx="60" cy="70" r="6"/>
        <rect class="box" x="36" y="84" width="48" height="12" rx="4"/>
        <circle class="led" cx="46" cy="90" r="2"/><circle class="led" cx="54" cy="90" r="2"/><circle class="led blink" cx="62" cy="90" r="2"/>`;
  }

  _gauge(m, sum) {
    return `<div class="hero-art ${this._gaugeCls(sum)} clickable"${moreInfo(m.download)} aria-label="${esc(`${this._t("download")} ${this._speed(sum.dl)} ${this._t("mbps")}`)}">
      <svg viewBox="0 0 120 100" aria-hidden="true">
        ${this._gaugeArt(sum)}
      </svg></div>`;
  }

  // The big download speed and the lines beside the gauge: upload, ping (and jitter, loss), share of the plan.
  _heroBody(m, sum) {
    const cls = sum.status.cls === "warn" || sum.status.cls === "crit" ? sum.status.cls : "accent";
    const lines = [`<div class="big ${cls}">${svgIcon(ICONS.download)}<b>${esc(this._speed(sum.dl))}</b><span>${esc(this._t("mbps"))}</span></div>`];
    const ln = (icon, text, entity, c = "") => `<div class="line ${c}${entity ? " clickable" : ""}"${moreInfo(entity)}>${svgIcon(icon)}<span>${esc(text)}</span></div>`;
    // Under its share of the plan's upload (plan_upload), the upload line turns amber as the download does.
    const ulSlow = sum.planUl && sum.ul !== null && !sum.testing && sum.ul < sum.planUl * sum.ratio;
    if (m.upload) lines.push(ln(ICONS.upload, `${this._speed(sum.ul)} ${this._t("mbps")} · ${this._t("upload")}`, m.upload, ulSlow ? "warn" : "active"));
    const pingBits = [];
    if (m.ping) pingBits.push(`${this._ms(sum.ping)} ${this._t("ms")} ${this._t("ping")}`);
    if (m.jitter) pingBits.push(`${this._ms(sum.jitter)} ${this._t("ms")} ${this._t("jitter")}`);
    if (m.loss) pingBits.push(`${this._ms(sum.loss)} % ${this._t("loss")}`);
    if (pingBits.length) lines.push(ln(ICONS.ping, pingBits.join(" · "), m.ping || m.jitter || m.loss, sum.status.entity === m.ping && m.ping ? "warn" : ""));
    // The share of the plan, coloured by the download speed alone: a high ping does not make the speed slow.
    if (sum.plan && sum.dl !== null) {
      const slow = sum.dl < sum.plan * sum.ratio;
      lines.push(ln(slow ? ICONS.alert : ICONS.check, this._t("of_plan", { p: Math.round((sum.dl / sum.plan) * 100) }), null, sum.testing ? "" : slow ? "warn" : "ok"));
    }
    else if (sum.status.cls !== "ok") lines.push(ln(ICONS.alert, sum.status.text, sum.status.entity, sum.status.cls));
    return `<div class="hero-body">${lines.join("")}</div>`;
  }

  // The lines of the download and upload speeds over the window, the plan's dashed line and the slowest test.
  _chart(sum) {
    const h = this._history;
    if (!h) return `<div class="empty">${esc(this._t("loading"))}</div>`;
    if (h.dl.length < 2) return `<div class="empty">${esc(this._t("no_history"))}</div>`;
    const W = 400;
    const H = 120;
    const end = Date.now();
    const start = end - h.days * DAY_MS;
    const top = Math.max(sum.plan || 0, ...h.dl.map((p) => p.v), ...h.ul.map((p) => p.v)) * 1.1;
    const x = (t) => ((t - start) / (end - start)) * W;
    const y = (v) => H - 4 - (clamp(v, 0, top) / top) * (H - 16);
    const xy = (pts) => pts.map((p) => `${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
    const line = (pts, cls) => `<polyline class="${cls}" points="${xy(pts)}" fill="none" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
    const area = `<polygon class="area" points="${x(h.dl[0].t).toFixed(1)},${H} ${xy(h.dl)} ${x(h.dl[h.dl.length - 1].t).toFixed(1)},${H}"/>`;
    const grid = [0.25, 0.5, 0.75].map((f) => `<line class="grid" x1="0" x2="${W}" y1="${y(top * f).toFixed(1)}" y2="${y(top * f).toFixed(1)}" stroke-width="1"/>`).join("");
    const plan = sum.plan ? `<line class="plan" x1="0" x2="${W}" y1="${y(sum.plan).toFixed(1)}" y2="${y(sum.plan).toFixed(1)}" stroke-width="1"/><text x="${W}" y="${(y(sum.plan) - 4).toFixed(1)}" text-anchor="end">${esc(this._t("plan", { speed: `${this._speed(sum.plan)} ${this._t("mbps")}` }))}</text>` : "";
    const low = h.dl.reduce((a, b) => (b.v < a.v ? b : a));
    const dipped = sum.reference && low.v < sum.reference * sum.ratio;
    const dip = dipped ? `<circle class="dip" cx="${x(low.t).toFixed(1)}" cy="${y(low.v).toFixed(1)}" r="4"/>` : "";
    const days = [];
    for (let i = h.days - 1; i >= 0; i--) days.push(new Intl.DateTimeFormat(this._locale(), { weekday: "short" }).format(new Date(end - i * DAY_MS)));
    const legend = `<div class="legend"><span class="k accent" style="--c: var(--st-accent)"><span class="sw"></span>${esc(this._t("download"))}</span>${h.ul.length ? `<span class="k" style="--c: var(--st-active)"><span class="sw"></span>${esc(this._t("upload"))}</span>` : ""}${
      dipped ? `<span class="dipnote">${svgIcon(ICONS.alert)}${esc(this._t("dip", { speed: `${this._speed(low.v)} ${this._t("mbps")}`, when: fmtWhen(this._hass, this._config, low.t) }))}</span>` : ""
    }</div>`;
    return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(this._t("history"))}">${grid}${area}${plan}${h.ul.length > 1 ? line(h.ul, "ul") : ""}${line(h.dl, "dl")}${dip}</svg>
      <div class="xaxis">${days.map((d) => `<span>${esc(d)}</span>`).join("")}</div>${legend}</div>`;
  }

  // Tiles as on the room overview: average and slowest download of the window (tinted when the slowest is slow), the
  // server and the provider.
  _tiles(m, sum) {
    const h = this._history;
    const tile = (icon, value, unit, label, entity, c = "") =>
      `<div class="tile${c ? ` tint ${c}` : ""}${entity ? " clickable" : ""}"${moreInfo(entity)}><div class="tile-head"><div class="row-icon${c ? "" : " idle"}">${svgIcon(icon)}</div><div class="row-text"><div class="row-name">${esc(value)}${unit ? `<small>${esc(unit)}</small>` : ""}</div><div class="row-state${c ? ` ${c}` : ""}">${esc(label)}</div></div></div></div>`;
    const out = [];
    if (h?.dl.length) {
      const vals = h.dl.map((p) => p.v);
      const low = Math.min(...vals);
      out.push(tile(ICONS.download, this._speed(vals.reduce((a, b) => a + b, 0) / vals.length), this._t("mbps"), this._t("average"), m.download));
      out.push(tile(ICONS.download, this._speed(low), this._t("mbps"), this._t("slowest"), m.download, sum.reference && low < sum.reference * sum.ratio ? "warn" : ""));
    }
    const srv = m.server ? this._s(m.server)?.state : this._s(m.ping || m.download)?.attributes?.server_name;
    const country = m.server ? null : this._s(m.ping || m.download)?.attributes?.server_country;
    const isp = m.isp ? this._s(m.isp)?.state : null;
    if (srv && valid({ state: srv })) out.push(tile(ICONS.server, [srv, country].filter(Boolean).join(", "), "", this._t("server"), m.server || m.ping));
    if (isp && valid({ state: isp })) out.push(tile(ICONS.server, isp, "", this._t("isp"), m.isp));
    return out.length ? `<div class="tiles" style="--cols: ${Math.min(out.length, 3)}">${out.join("")}</div>` : "";
  }

  // How a test is run here: the configured or found button, else the integration's own way; null when none.
  _runCall(m) {
    if (m.button) return ["button", "press", { entity_id: m.button }];
    const run = PLATFORMS[m.platform]?.run;
    // A service; "download" for its data targets the download sensor's speed test only (Ookla: one test per server).
    if (Array.isArray(run)) return [run[0], run[1], run[2] === "download" ? { entity_id: m.download } : run[2]];
    if (run === "update") return ["homeassistant", "update_entity", { entity_id: m.download }];
    return null;
  }

  _runButton(m, sum, round = false) {
    if (this._config.show_run === false || !this._runCall(m)) return "";
    const label = sum.testing ? this._t("testing") : this._t("run_test");
    const cls = `btn${round ? " round" : ""}${sum.testing ? " active spin" : ""}`;
    return `<button class="${cls}" data-action="run" title="${esc(label)}" aria-label="${esc(label)}"${sum.testing ? " disabled" : ""}>${svgIcon(sum.testing ? ICONS.refresh : ICONS.play)}${round ? "" : `<span>${esc(label)}</span>`}</button>`;
  }

  _action(action) {
    if (action !== "run") return false;
    const m = this._resolve();
    const call = m && this._runCall(m);
    if (!call) return true;
    this._call(...call);
    this._testing = Date.now();
    this._testedFrom = this._s(m.download)?.last_updated;
    clearTimeout(this._testTimer);
    this._testTimer = setTimeout(() => {
      this._testing = null;
      this._update();
    }, TEST_MS);
    this._update();
    return true;
  }

  // A new result ends the test the card started.
  set hass(hass) {
    const m = this._model;
    if (this._testing && m && hass?.states?.[m.download]?.last_updated !== this._testedFrom) this._testing = null;
    super.hass = hass;
  }

  get hass() {
    return super.hass;
  }

  _render() {
    const { m, error } = this._ready();
    if (error) return error;
    const c = this._config;
    const sum = this._summary(m);
    const parts = [`<div class="hero">${this._gauge(m, sum)}${this._heroBody(m, sum)}</div>`];
    if (c.show_history !== false) parts.push(this._section("history", ICONS.chart, this._t("last_days", { n: Number(c.history_days) || 7 }), "", this._chart(sum)));
    if (c.show_stats !== false) parts.push(this._tiles(m, sum));
    const run = this._runButton(m, sum);
    if (run) parts.push(`<div class="foot">${run}${sum.last ? `<span class="note">${esc(this._t("last_test", { when: fmtRelative(this._hass, this._config, sum.last) }))}</span>` : ""}</div>`);
    return `<style>${BASE_STYLE}${SPEED_STYLE}${this._styles()}</style>
      <ha-card>
        ${this._head(sum, this._subtitle(m, sum))}
        <div class="content">${parts.filter(Boolean).join("")}</div>
      </ha-card>`;
  }
}

class SpeedtestMiniCard extends withMini(SpeedtestCard) {
  static getConfigElement() {
    return document.createElement("speedtest-mini-card-editor");
  }

  _renderMini() {
    const { m, error } = this._ready();
    if (error) return error;
    const sum = this._summary(m);
    const cls = sum.status.cls === "warn" || sum.status.cls === "crit" ? sum.status.cls : "accent";
    const second = [m.upload ? `${this._speed(sum.ul)} ${this._t("mbps")}` : null, m.ping ? `${this._ms(sum.ping)} ${this._t("ms")}` : null].filter(Boolean).join(" · ");
    const run = this._runButton(m, sum, true);
    return `<style>${BASE_STYLE}${SPEED_STYLE}${MINI_STYLE}${this._styles()}</style>
      <ha-card>
        ${this._head(sum, "")}
        <div class="content mini">
          ${this._gauge(m, sum)}
          <div class="info">
            <div class="big ${cls} clickable"${moreInfo(m.download)}>${svgIcon(ICONS.download)}<b>${esc(this._speed(sum.dl))}</b><span>${esc(this._t("mbps"))}</span></div>
            ${second ? `<div class="line active">${svgIcon(ICONS.upload)}<span>${esc(second)}</span></div>` : ""}
          </div>
          ${run ? `<div class="controls">${run}</div>` : ""}
        </div>
      </ha-card>`;
  }
}

// ---------------------------------------------------------------------------
// Visual editors
// ---------------------------------------------------------------------------

class SpeedtestCardEditor extends EditorBase {
  static get toggles() {
    return [
      ["illustration", true],
      ["show_title", true],
      ["show_subtitle", true],
      ["show_history", true],
      ["show_stats", true],
      ["show_run", true],
    ];
  }

  static get defaults() {
    return { history_days: 7, alert_ratio: 0.5, ping_alert: 100, illustration_theme: "auto" };
  }

  static get sections() {
    return ["history"];
  }

  _fields() {
    return [
      { name: "download", selector: { entity: { domain: "sensor" } } },
      { name: "upload", selector: { entity: { domain: "sensor" } } },
      { name: "ping", selector: { entity: { domain: "sensor" } } },
      { name: "jitter", selector: { entity: { domain: "sensor" } } },
      { name: "button", selector: { entity: { domain: "button" } } },
      // Several speed tests (two Speedtest.net servers, a router and Speedtest Tracker): the one the card shows.
      { name: "device", selector: { device: { filter: Object.keys(PLATFORMS).map((integration) => ({ integration })) } } },
      {
        name: "illustration_theme",
        selector: { select: { mode: "dropdown", options: ["auto", "day", "night"].map((v) => ({ value: v, label: t(this._hass, this._config, `theme_${v}`) })) } },
      },
      {
        type: "grid",
        name: "",
        schema: [
          { name: "plan_download", selector: { number: { min: 0, max: 100000, step: 1, mode: "box", unit_of_measurement: "Mbit/s" } } },
          { name: "plan_upload", selector: { number: { min: 0, max: 100000, step: 1, mode: "box", unit_of_measurement: "Mbit/s" } } },
          { name: "history_days", selector: { number: { min: 1, max: 30, step: 1, mode: "box" } } },
          { name: "alert_ratio", selector: { number: { min: 0.1, max: 1, step: 0.05, mode: "box" } } },
          { name: "ping_alert", selector: { number: { min: 1, max: 2000, step: 1, mode: "box", unit_of_measurement: "ms" } } },
        ],
      },
    ];
  }
}

// The mini card's detail view is the full card: its editor offers the full card's options, plus the detail button.
class SpeedtestMiniCardEditor extends SpeedtestCardEditor {
  static get toggles() {
    return [...SpeedtestCardEditor.toggles, ["zoom", true]];
  }
}

register(
  [
    ["speedtest-card", SpeedtestCard, { name: "Speedtest Card", description: "Internet speed: download gauge, upload, ping and jitter, 7-day history against your plan, and a button to run a test." }],
    ["speedtest-mini-card", SpeedtestMiniCard, { name: "Speedtest Mini Card", description: "Compact internet speed: a small gauge, download, upload and ping, a run button, and the full card behind its detail button." }],
    ["speedtest-card-editor", SpeedtestCardEditor],
    ["speedtest-mini-card-editor", SpeedtestMiniCardEditor],
  ],
  "https://github.com/juju35/ha-speedtest-card",
);

console.info(`%c SPEEDTEST-CARD %c v${VERSION} `, "color: white; background: #00897b; font-weight: 700;", "color: #00897b; background: white; font-weight: 700;");
