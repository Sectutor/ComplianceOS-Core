import { Regulation } from "./types";
import { gdpr } from "./gdpr";
import { hipaa } from "./hipaa";
import { nis2 } from "./nis2";
import { dora } from "./dora";
import { euAiAct } from "./eu_ai_act";
import { cmmc } from "./cmmc";
import { ccpa } from "./ccpa";

export const regulations: Regulation[] = [
    gdpr,
    ccpa,
    hipaa,
    nis2,
    dora,
    euAiAct,
    cmmc
];

export const getRegulation = (id: string): Regulation | undefined => {
    return regulations.find(r => r.id === id);
};
