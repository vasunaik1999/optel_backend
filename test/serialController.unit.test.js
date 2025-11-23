import test from 'node:test';
import assert from 'node:assert/strict';

import * as serialController from '../src/controllers/serialController.js';
import prisma from '../src/prisma.js';
import QRCode from 'qrcode';
import fs from 'fs';

function makeRes() {
  const res = {};
  res._status = 200;
  res._body = undefined;
  res.status = (code) => { res._status = code; return res; };
  res.json = (obj) => { res._body = obj; return res; };
  return res;
}

test('addSerialNumber - positive: creates when not exists', async () => {
  const req = { body: { serialNumber: 'SNO0000001', mrp: 120 } };
  const res = makeRes();

  // backup
  const origFindUnique = prisma.serialNumber.findUnique;
  const origCreate = prisma.serialNumber.create;
  const origUpdate = prisma.serialNumber.update;
  const origQRCodeToFile = QRCode.toFile;
  const origFsExists = fs.existsSync;
  const origFsMkdir = fs.mkdirSync;

  // mock
  prisma.serialNumber.findUnique = async ({ where }) => null;
  prisma.serialNumber.create = async ({ data }) => ({ id: 1, ...data });
  prisma.serialNumber.update = async ({ where, data }) => ({ id: where.id, ...data });
  QRCode.toFile = async () => {};
  fs.existsSync = () => true;
  fs.mkdirSync = () => {};

  try {
    await serialController.addSerialNumber(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body.success, true);
    assert.equal(res._body.data.serialNumber, 'SNO0000001');
    assert.equal(res._body.data.mrp, 120);
  } finally {
    // restore
    prisma.serialNumber.findUnique = origFindUnique;
    prisma.serialNumber.create = origCreate;
    prisma.serialNumber.update = origUpdate;
    QRCode.toFile = origQRCodeToFile;
    fs.existsSync = origFsExists;
    fs.mkdirSync = origFsMkdir;
  }
});

test('addSerialNumber - negative: returns 400 when serial exists', async () => {
  const req = { body: { serialNumber: 'SNO0000002', mrp: 200 } };
  const res = makeRes();

  // backup
  const origFindUnique = prisma.serialNumber.findUnique;

  // mock existing
  prisma.serialNumber.findUnique = async ({ where }) => ({ id: 2, serialNumber: where.serialNumber, mrp: 200 });

  try {
    await serialController.addSerialNumber(req, res);

    assert.equal(res._status, 400);
    assert.equal(res._body.message, 'Serial already exists');
  } finally {
    prisma.serialNumber.findUnique = origFindUnique;
  }
});
