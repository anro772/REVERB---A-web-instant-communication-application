import { User } from "./user";

export class UserParams {
    minAge = 1;
    maxAge = 100;
    pageNumber = 1;
    pageSize = 18;
    orderBy = 'lastActive';
    username?: string;

    constructor(user: User) {

    }
}