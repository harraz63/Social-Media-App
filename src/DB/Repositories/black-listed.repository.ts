import { Model } from "mongoose";
import { IBlackListedToken } from "../../Common/Interfaces";
import { BlackListedTokenModel } from "../Models/black-listed-tokens.model";
import { BaseRepository } from "./base.repository";

export class BlackListedTokenRepository extends BaseRepository<IBlackListedToken> {
  constructor(protected _blackListedTokenModel: Model<IBlackListedToken>) {
    super(BlackListedTokenModel);
  }


  



}
