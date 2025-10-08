import { IFriendShip } from "../../Common/Interfaces";
import { FriendShipModel } from "../Models";
import { BaseRepository } from "./base.repository";




export class FriendShipRepository extends BaseRepository<IFriendShip> {
    constructor() {
        super(FriendShipModel); 
    }
}
