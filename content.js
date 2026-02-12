export const GAME_CONFIG = {
  roundSeconds: 45,
  targetScore: 20,
  spawnMsRange: [450, 900],
  skipDodgeCount: 5,
  catcherSpeed: 460,
};

export const APP_COPY = {
  introTitle: "A Tiny Valentine Challenge",
  introSubtitle: "Catch enough hearts to unlock your letter.",
  introCta: "Start",
  winTitle: "You Did It",
  winCopy: "You caught enough hearts. I knew you would.",
  loseTitle: "Almost There",
  loseCopy: "Want to try one more quick round, or skip to the letter?",
  skipConfirmTitle: "Are you really sure?",
  skipConfirmBody: "I made this part for you. Want to skip to the letter anyway?",
  dodgeLines: [
    "Just one more try?",
    "It'll be quick, promise.",
    "You're so close already.",
    "Maybe one lucky round?",
    "Okay okay... I'll let you choose.",
  ],
};

export const LETTER = {
  greeting: "Dear 루라,",
  paragraphs: [
    "발렌타인데이야 💕\n항상 내 곁에 있어줘서 고마워.\n너랑 함께하는 매일이 나한테는 선물이야. 사랑해.",
  ],
  signoff: "From, \nNick",
  signature: "",
  dateLine: "February 14th, 2026",
};

export const LOTTIE_ASSETS = {
  // Put local files in /assets/lottie and keep these names.
  loading: "/assets/lottie/loading.json",
  intro: "/assets/lottie/intro.json",
  win: "/assets/lottie/win.json",
  introBunnies: "/assets/lottie/cutie-bunnies-love.lottie",
  winBunnies: "/assets/lottie/cutie-bunnies-love.lottie",
  birdDelivery: "/assets/lottie/flappy-bird-delivering-message.lottie",
  envelopeOpen: "/assets/lottie/open-envelope.lottie",
  globalHeartsBg: "/assets/lottie/hearts-background.lottie",
  letterHeartsBg: "/assets/lottie/hearts-background.lottie",
  letterBunnies: "/assets/lottie/cutie-bunnies-love.lottie",
};
