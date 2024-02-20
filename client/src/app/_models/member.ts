import { Photo } from "./photo";

export interface Member {
    id: number;
    userName: string;
    photoUrl: string;
    age: number;
    knownAs: string;
    created: Date;
    lastActive: Date;
    introduction: string;
    email: string;
    phoneNumber: string;
    photo: Photo | null;
}