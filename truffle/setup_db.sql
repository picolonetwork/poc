create user local;
create user ropsten;
grant insert,update on system.users to ropsten,local;
create database local;
create database ropsten;
grant create on ropsten to ropsten;
grant create on database local to local;
grant select,insert on local.* to local;
grant select,insert on ropsten.* to ropsten;
