import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Address, beginCell, toNano } from 'ton-core';
import { Task2 } from '../wrappers/Task2';
import '@ton-community/test-utils';

const admin = Address.parse('EQBGhqLAZseEqRXz4ByFPTGV7SVMlI4hrbs-Sps_Xzx01x8G');

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

    it('1. user call with random body', async () => {
        const deployer = await blockchain.treasury('deployer');
        const user = await blockchain.treasury('user');

        const result = await task2.send(
            user.getSender(),
            { value: toNano('0.05') },
            beginCell().storeInt(78, 16).endCell().asSlice()
        );
        expect(result.transactions).toHaveTransaction({
            from: task2.address,
            to: deployer.address,
            body: beginCell()
                .storeAddress(user.address)
                .storeRef(beginCell().storeSlice(beginCell().storeInt(78, 16).endCell().asSlice()).endCell())
                .endCell(),
            value: (x) => (x ? toNano('0.00') <= x && x <= toNano('0.05') : false),
        });
    });

    it('if admin call 0x44', async () => {
        const deployer = await blockchain.treasury('deployer');
        const user = await blockchain.treasury('user'); // Snt

        const sendResult = await task2.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            { $$type: 'Refund', queryId: BigInt(0), sender: user.address }
        );

        expect(sendResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: task2.address,
            success: true,
            op: 0x44,
            value: toNano('0.05'),
        });

        expect(sendResult.transactions).toHaveTransaction({
            from: task2.address,
            to: user.address,
            success: true,
            value: (x) => (x ? toNano('0.00') <= x && x <= toNano('0.05') : false),
        });
    });

    // it('should forward from another wallet', async () => {
    //     const deployer = await blockchain.treasury('deployer');
    //     let user = await blockchain.treasury('user');
    // const result = await user.send({
    //     to: task2.address,
    //     value: toNano('1'),
    //     body: beginCell().storeAddress(context().sender).storeRef(beginCell().storeSlice(msg).endCell()).endCell(),
    // });
    // expect(result.transactions).toHaveTransaction({
    //     from: task2.address,
    //     to: deployer.address,
    //     body: beginCell()
    //         .storeAddress(user.address)
    //         .storeRef(beginCell().storeStringTail('Hello, world!').endCell())
    //         .endCell(),
    //     value: (x) => (x ? toNano('0.99') <= x && x <= toNano('1') : false),
    // });
    // });
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
