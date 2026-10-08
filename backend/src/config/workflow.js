exports.STAGES = [
  { position: 1, departmentId: 1, key: "design" },
  { position: 2, departmentId: 2, key: "production" },
  { position: 3, departmentId: 3, key: "quality" },
  { position: 4, departmentId: 4, key: "dispatch" },
];

exports.isHead = (role) => /^(design|production|quality|dispatch)_head$/.test(role);
