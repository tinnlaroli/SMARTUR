// Frame offsets for SmartURPromo — audio-driven timing at 30fps
// Audio durations (measured): intro=289f, puente=187f, b2b-title=97f
// B2B-1=194f, B2B-2=156f, B2B-3=219f, B2B-4=256f, B2B-5=163f, B2B-6=224f
// b2c-title=85f, B2C-1=201f, B2C-2y3=357f(joint 2+3), B2C-5=507f(joint 4+5), OUTRO=224f
// 12-frame buffer after each B2B/B2C step for breathing room

export const T = {
  INTRO_IN:        0,
  INTRO_OUT:       289,

  BRIDGE_IN:       289,
  BRIDGE_OUT:      476,     // 289 + 187

  B2B_TITLE_IN:    476,
  B2B_TITLE_OUT:   573,     // 476 + 97

  B2B_1_IN:        573,
  B2B_1_OUT:       779,     // 573 + 194 + 12

  B2B_2_IN:        779,
  B2B_2_OUT:       947,     // 779 + 156 + 12

  B2B_3_IN:        947,
  B2B_3_OUT:       1178,    // 947 + 219 + 12

  B2B_4_IN:        1178,
  B2B_4_OUT:       1446,    // 1178 + 256 + 12

  B2B_5_IN:        1446,
  B2B_5_OUT:       1621,    // 1446 + 163 + 12

  B2B_6_IN:        1621,
  B2B_6_OUT:       1857,    // 1621 + 224 + 12

  B2C_TITLE_IN:    1857,
  B2C_TITLE_OUT:   1942,    // 1857 + 85

  B2C_1_IN:        1942,
  B2C_1_OUT:       2155,    // 1942 + 201 + 12

  // B2C-2y3.mp3 covers scenes 2 and 3 (357f total audio, from B2C_2_IN)
  B2C_2_IN:        2155,
  B2C_2_OUT:       2335,    // visual cut at 180f into the shared audio
  B2C_3_IN:        2335,
  B2C_3_OUT:       2524,    // 2155 + 357 + 12

  // B2C-5.mp3 covers scenes 4 and 5 (507f total audio, from B2C_4_IN)
  B2C_4_IN:        2524,
  B2C_4_OUT:       2724,    // visual cut at 200f into the shared audio
  B2C_5_IN:        2724,
  B2C_5_OUT:       3043,    // 2524 + 507 + 12

  OUTRO_IN:        3043,
  OUTRO_OUT:       3267,    // 3043 + 224
} as const;

export const TOTAL_FRAMES = T.OUTRO_OUT; // 3267 frames = 108.9s
