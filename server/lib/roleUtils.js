export const canMessage = (sender, receiver) => {
  const openRoles = ["Admin", "Employee", "Project Coordinator"];

  if (openRoles.includes(sender.role) || openRoles.includes(receiver.role)) {
    return true;
  }

  if (
    sender.role === "Freelancer" &&
    receiver.role === "Customer"
  ) {
    return sender.approvedToChat.includes(receiver._id);
  }

  if (
    sender.role === "Customer" &&
    receiver.role === "Freelancer"
  ) {
    return sender.approvedToChat.includes(receiver._id);
  }

  return true;
};
