// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames} from "@subql/types";
import assert from 'assert';




type TreasurayBalanceProps = Omit<TreasurayBalance, NonNullable<FunctionPropertyNames<TreasurayBalance>>>;

export class TreasurayBalance implements Entity {

    constructor(id: string) {
        this.id = id;
    }


    public id: string;

    public timestamp?: Date;

    public balance?: number;


    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save TreasurayBalance entity without an ID");
        await store.set('TreasurayBalance', id.toString(), this);
    }
    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove TreasurayBalance entity without an ID");
        await store.remove('TreasurayBalance', id.toString());
    }

    static async get(id:string): Promise<TreasurayBalance | undefined>{
        assert((id !== null && id !== undefined), "Cannot get TreasurayBalance entity without an ID");
        const record = await store.get('TreasurayBalance', id.toString());
        if (record){
            return TreasurayBalance.create(record as TreasurayBalanceProps);
        }else{
            return;
        }
    }



    static create(record: TreasurayBalanceProps): TreasurayBalance {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new TreasurayBalance(record.id);
        Object.assign(entity,record);
        return entity;
    }
}
