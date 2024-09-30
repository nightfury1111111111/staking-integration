export type TokenLock = {
  version: "0.1.0";
  name: "token_lock";
  instructions: [
    {
      name: "initAdmin";
      accounts: [
        {
          name: "admin";
          isMut: true;
          isSigner: true;
        },
        {
          name: "tokenRecipient";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenMint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "vault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "adminState";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "rent";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "startDate";
          type: "u64";
        },
        {
          name: "lockPeriod";
          type: "u64";
        },
        {
          name: "lockAmount";
          type: "u64";
        }
      ];
    },
    {
      name: "updateAdmin";
      accounts: [
        {
          name: "admin";
          isMut: true;
          isSigner: true;
        },
        {
          name: "newAdmin";
          isMut: true;
          isSigner: false;
        },
        {
          name: "newTokenRecipient";
          isMut: false;
          isSigner: false;
        },
        {
          name: "adminState";
          isMut: true;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "startDate";
          type: "u64";
        },
        {
          name: "lockPeriod";
          type: "u64";
        },
        {
          name: "lockAmount";
          type: "u64";
        }
      ];
    },
    {
      name: "sendToken";
      accounts: [
        {
          name: "user";
          isMut: true;
          isSigner: true;
        },
        {
          name: "adminState";
          isMut: true;
          isSigner: false;
        },
        {
          name: "vault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenMint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenRecipient";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: "adminState";
      type: {
        kind: "struct";
        fields: [
          {
            name: "admin";
            type: "publicKey";
          },
          {
            name: "tokenRecipient";
            type: "publicKey";
          },
          {
            name: "tokenMint";
            type: "publicKey";
          },
          {
            name: "startDate";
            type: "u64";
          },
          {
            name: "lockPeriod";
            type: "u64";
          },
          {
            name: "lockAmount";
            type: "u64";
          }
        ];
      };
    }
  ];
};

export const IDL: TokenLock = {
  version: "0.1.0",
  name: "token_lock",
  instructions: [
    {
      name: "initAdmin",
      accounts: [
        {
          name: "admin",
          isMut: true,
          isSigner: true,
        },
        {
          name: "tokenRecipient",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "vault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "adminState",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "startDate",
          type: "u64",
        },
        {
          name: "lockPeriod",
          type: "u64",
        },
        {
          name: "lockAmount",
          type: "u64",
        },
      ],
    },
    {
      name: "updateAdmin",
      accounts: [
        {
          name: "admin",
          isMut: true,
          isSigner: true,
        },
        {
          name: "newAdmin",
          isMut: true,
          isSigner: false,
        },
        {
          name: "newTokenRecipient",
          isMut: false,
          isSigner: false,
        },
        {
          name: "adminState",
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "startDate",
          type: "u64",
        },
        {
          name: "lockPeriod",
          type: "u64",
        },
        {
          name: "lockAmount",
          type: "u64",
        },
      ],
    },
    {
      name: "sendToken",
      accounts: [
        {
          name: "user",
          isMut: true,
          isSigner: true,
        },
        {
          name: "adminState",
          isMut: true,
          isSigner: false,
        },
        {
          name: "vault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenRecipient",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "adminState",
      type: {
        kind: "struct",
        fields: [
          {
            name: "admin",
            type: "publicKey",
          },
          {
            name: "tokenRecipient",
            type: "publicKey",
          },
          {
            name: "tokenMint",
            type: "publicKey",
          },
          {
            name: "startDate",
            type: "u64",
          },
          {
            name: "lockPeriod",
            type: "u64",
          },
          {
            name: "lockAmount",
            type: "u64",
          },
        ],
      },
    },
  ],
};
