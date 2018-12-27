cleos multisig propose multisig '[{"actor": "1bizauhilkat", "permission": "active"}, {"actor": "familyv12345", "permission": "active"},{"actor": "singasong115", "permission": "active"}, {"actor": "angelooooool", "permission": "active"}, {"actor": "techradar123", "permission": "active"}]' '[{"actor": "slantagpurse", "permission": "active"}]' priveostoken transfer '{"from": "slantagpurse", "to": "angelooooool", "quantity": "1.2345 PRIVEOS", "memo": "Multisig test"}' angelooooool -p angelooooool

cleos multisig approve angelooooool multisig '{"actor": "1bizauhilkat", "permission": "active"}' -p 1bizauhilkat
cleos multisig approve angelooooool multisig '{"actor": "familyv12345", "permission": "active"}' -p familyv12345
cleos multisig approve angelooooool multisig '{"actor": "singasong115", "permission": "active"}' -p singasong115

cleos multisig exec angelooooool multisig -p angelooooool