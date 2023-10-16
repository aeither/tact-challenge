import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Address, beginCell, toNano } from 'ton-core';
import { Task2 } from '../wrappers/Task2';
import '@ton-community/test-utils';

const admin = Address.parse('EQBGhqLAZseEqRXz4ByFPTGV7SVMlI4hrbs-Sps_Xzx01x8G');
const vaniton = Address.parse('EQAnTon5VVNKup8v0EUT0SvCKsRmEpotr_3eSpqYJTneIVht');

describe('Task2', () => {
    let blockchain: Blockchain;
    let task2: SandboxContract<Task2>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        task2 = blockchain.openContract(await Task2.fromInit(admin));
        const deployer = await blockchain.treasury('deployer');
        const deployResult = await task2.send(
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
            to: task2.address,
            deploy: true,
            success: true,
        });
    });

    it('test', async () => {
        const deployer = await blockchain.treasury('deployer');
        console.log(deployer.getSender());

        const sendResult = await task2.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            { $$type: 'Refund', queryId: BigInt(1), sender: vaniton }
        );

        expect(sendResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: task2.address,
            success: true,
            op: 0x44,
            // body: beginCell()
        });
    });

    it('test2', async () => {
        const deployer = await blockchain.treasury('deployer');

        await task2.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            { $$type: 'Refund', queryId: BigInt(1), sender: admin }
        );
    });
});

/*
  TASK 2 - Proxy 
  Create a contract that forwards all received TONs
  to the admin contract (whose address is set in init_store).
  Message from this proxy contract to the admin contract should contain:
    - Address of user who sent original message (should be stored in the outcoming body's data/bits)
    - Original message that proxy smart contract received from user (should be stored in the outcoming body's first ref)
  Also, if admin contract decides to reject message (if it sends to the proxy "Refund" message with opcode=0x44),
  proxy contract needs to forward all TONs (attached to Refund message) back to the user.
  User address will be provided in Refund message body as "sender".
  In refund transaction, it is important to have a check that the refund message came from the admin address
*/
