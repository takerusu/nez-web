export class Auth {
    constructor(public req: any, public res: any) {}

    set(userId:string, userName:string): void {
        //this.res.cookie('userId', userId, {path: '/'});
        this.res.cookie('userName', userName, {path: '/'});
        this.res.cookie('sessionUserId', userId, { signed: true });
        this.res.cookie('sessionUserName', userName, { signed: true }); 
        this.req.session.userId = userId;
        this.req.session.userName = userName;
    }

    clear(): void {
        //this.res.clearCookie('userId');
        this.res.clearCookie('userName');
        this.res.clearCookie('sessionUserId');
        this.res.clearCookie('sessionUserName'); 
        delete this.req.session.userId;
        delete this.req.session.userName;
    }

}

export function isLogin(req) {
    if(req.signedCookies) {
        return req.signedCookies.sessionUserId != null;
    }
    return false;
}

export function setStudentNumber(res: any, id: string): void {
    res.cookie('studentNumber', id);
}

