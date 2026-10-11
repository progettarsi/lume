/** Exact phase B parameters. Complex shape and transition choreography belongs
 * to C. Timing values animate presentation only and never lock navigation. */
export const ONBOARDING_LAYOUT={referenceWidth:402,referenceHeight:874,maxWidth:440,gutter:24,compactGutter:20,titleSize:36,titleLine:43,bodySize:17,bodyLine:25,avatar:140,compactAvatar:112,inputMinHeight:52,chipMinHeight:48,footerMinHeight:80,actionHit:56,actionShape:50,demoCardMinHeight:218};
export const ONBOARDING_MOTION={
 rays:{delay:120,duration:260,fromScale:.94,toScale:1,easing:[.22,1,.36,1]},
 introContinue:{delay:180,duration:220,easing:[.22,1,.36,1]},
 bounce:{downDuration:70,returnDuration:160,translateY:2,overshoot:-1},
 placeholder:{names:['Alex','Sofia','Andrea'],typeInterval:90,eraseInterval:45,pause:1100,focusEraseInterval:16},
 arrowShape:{rotationDuration:18000,morphDuration:6000,minScale:.98,maxScale:1.02},
 background:{duration:24000,translateX:8,translateY:12,rotation:4},
 titles:{eraseInterval:18,typeInterval:32,pause:70},
 swipeHint:{initialDelay:600,moveDuration:650,returnDuration:420,pause:2200,travelFraction:.18,maxLoops:2},
 homeTransition:{duration:220,easing:[.22,1,.36,1]},
} as const;
export type MotionEnvironment={reduced:boolean;appActive:boolean;visible:boolean};
export type OrganicShapeKind='identity-action'|'interests-action'|'preparation'|'flower'|'soft-boom'|'soft-burst'|'puffy';
