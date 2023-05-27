import { atom } from "jotai";
import { User } from "./model";

export const userAtom = atom<User | null>(null);
