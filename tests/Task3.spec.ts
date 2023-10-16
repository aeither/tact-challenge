import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Address, toNano } from 'ton-core';
import { Task3 } from '../wrappers/Task3';
import '@ton-community/test-utils';

const admin = Address.parse('0QB9GQZNO-Ge9Hys8KXFGXsaq2EHmrmVsEHciFKDU5W2RG9c');
const newJettonAddressA = Address.parse('0QB9GQZNO-Ge9Hys8KXFGXsaq2EHmrmVsEHciFKDU5W2RG9c');
const newJettonAddressB = Address.parse('0QB9GQZNO-Ge9Hys8KXFGXsaq2EHmrmVsEHciFKDU5W2RG9c');

describe('Task3', () => {
    let blockchain: Blockchain;
    let task3: SandboxContract<Task3>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        task3 = blockchain.openContract(await Task3.fromInit(admin, newJettonAddressA, newJettonAddressB));
        const deployer = await blockchain.treasury('deployer');
        const deployResult = await task3.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );
        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: task3.address,
            deploy: true,
            success: true,
        });
    });

    it('test', async () => {});
});
