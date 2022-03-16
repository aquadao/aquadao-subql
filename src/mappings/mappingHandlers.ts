import { forceToCurrencyName } from "@acala-network/sdk-core";
import { FixedNumber } from "@ethersproject/bignumber";
import { encodeAddress } from '@polkadot/util-crypto';
import { SubstrateBlock } from "@subql/types";
import { TreasurayBalance } from '../types';

const getPrice = async () => {
	const averagePrices = await  api.query.dexOracle.averagePrices([
		{
			Token: 'AUSD'
		},
		{
			Token: 'ADAO'
		}
	])

	const palletAddress = encodeAddress('0x6d6f646c617175612f7374740000000000000000000000000000000000000000');

	const sdaoIssuance = await api.query.tokens.totalIssuance({
		Token: 'SDAO'
	})

	const adaoBalance: any = await api.query.tokens.accounts(palletAddress, {
		Token: 'ADAO'
	})

	const data = {
		sdaoIssuance: FixedNumber.fromBytes(sdaoIssuance.toHex(), 12),
		free: FixedNumber.fromBytes(adaoBalance.free.toHex(), 12),
		reserved: FixedNumber.fromBytes(adaoBalance.reserved.toHex(), 12),
		frozen: FixedNumber.fromBytes(adaoBalance.frozen.toHex(), 12)
	};


	const exchangeRate = data.sdaoIssuance.isZero() ? 
		FixedNumber.fromBytes(api.consts.aquaStakedToken.defaultExchangeRate.toHex(), 18) : 
		data.free.addUnsafe(data.reserved).addUnsafe(data.frozen).divUnsafe(data.sdaoIssuance);

	const result = (averagePrices as any).unwrap() as any;
  const [, adaoPrice] = [FixedNumber.fromBytes(result[0].toHex()), FixedNumber.fromBytes(result[1].toHex())]

	return {
		'ADAO': adaoPrice,
		'AUSD': FixedNumber.fromString('1'),
		'SDAO': exchangeRate.toFormat('fixed').mulUnsafe(adaoPrice)
	}
}

const getBalance = async () => {
	const reserveAccount = api.consts.aquaStakedToken.daoAccount.toString()
	
	const entries = await api.query.tokens.accounts.entries(reserveAccount)
	const price = await getPrice()

	let total = FixedNumber.fromString('0')

	for(const entry of entries) {
		const token = forceToCurrencyName(entry[0].args[1])
		const balance: any = entry[1]

		const tokenPrice = price[token.toUpperCase()]

		if(tokenPrice) {
			const data = {
				free: FixedNumber.fromBytes(balance.free.toHex(), 12),
				reserved: FixedNumber.fromBytes(balance.reserved.toHex(), 12),
				frozen: FixedNumber.fromBytes(balance.frozen.toHex(), 12)
			};

			total = data.free.addUnsafe(data.reserved).addUnsafe(data.frozen).toFormat('fixed').mulUnsafe(tokenPrice).addUnsafe(total)
		}
	}

	return total
}


export const handleBlock = async (block: SubstrateBlock) => {
	const blockNumber = block.block.header.number.toNumber()

	if(blockNumber % 600 === 0) {
		const timestamp = block.timestamp
		const balance = await getBalance()
		const record = new TreasurayBalance(`${blockNumber}`)
		
		record.timestamp = timestamp
		record.balance = balance.round(5).toUnsafeFloat()
		
		await record.save()

	}
};

