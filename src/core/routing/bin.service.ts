import axios from 'axios';

export interface BinInfo {
        country: string; // ISO code e.g. "NG", "US"
        bank: string;
        type: string; // debit, credit
}

export class BinService {
        /**
         * Identifies card properties from the first 6-8 digits
         */
        async lookup(bin: string): Promise<BinInfo | null> {
                try {
                        const { data } = await axios.get(`https://lookup.binlist.net/${bin}`);
                        return {
                                country: data.country?.alpha2 || 'UNKNOWN',
                                bank: data.bank?.name || 'UNKNOWN',
                                type: data.type || 'UNKNOWN'
                        };
                } catch (error) {
                        console.error('BIN Lookup failed:', error);
                        return null;
                }
        }
}
