export type AdminTeamMessages = {
  team: {
    title: string
    description: string
    pendingInvitations: string
    noOutstandingInvitations: string
    invitationWaitingSingular: string
    invitationWaitingPlural: string
    nothingHereYet: string
    revoke: string
    revokeConfirm: string
    expires: string
    history: string
    historyDescription: string
    redeemed: string
    expired: string
    inviteMember: string
    inviteDialogTitle: string
    inviteDialogDescription: string
    inviteCreated: string
    inviteEmailSentSuffix: string
    inviteManualShareSuffix: string
    acceptLink: string
    copied: string
    copy: string
    done: string
    errorCouldNotSendInvitation: string
    emailLabel: string
    emailPlaceholder: string
    cancel: string
    sendInvitation: string
  }
}

export const adminTeamMessages = {
  en: {
    team: {
      title: "Team",
      description:
        "Invite new staff members. Sign-up is disabled for the public - only invited people can join.",
      pendingInvitations: "Pending invitations",
      noOutstandingInvitations: "No outstanding invitations.",
      invitationWaitingSingular: "{count} invitation waiting to be accepted.",
      invitationWaitingPlural: "{count} invitations waiting to be accepted.",
      nothingHereYet: "Nothing here yet.",
      revoke: "Revoke",
      revokeConfirm: "Revoke invitation for {email}?",
      expires: "Expires {date}",
      history: "History",
      historyDescription: "Redeemed or expired invitations.",
      redeemed: "Redeemed {date}",
      expired: "Expired {date}",
      inviteMember: "Invite member",
      inviteDialogTitle: "Invite a team member",
      inviteDialogDescription:
        "They'll receive an email with a link to set a password. The link expires in 72 hours.",
      inviteCreated: "Invitation created for {email}.",
      inviteEmailSentSuffix: "An email has been sent.",
      inviteManualShareSuffix: "No email provider configured - share the link below manually.",
      acceptLink: "Accept link",
      copied: "Copied",
      copy: "Copy",
      done: "Done",
      errorCouldNotSendInvitation: "Could not send invitation",
      emailLabel: "Email",
      emailPlaceholder: "teammate@example.com",
      cancel: "Cancel",
      sendInvitation: "Send invitation",
    },
  },
  ro: {
    team: {
      title: "Echipa",
      description:
        "Invita membri noi ai echipei. Inregistrarea publica este dezactivata - doar persoanele invitate se pot alatura.",
      pendingInvitations: "Invitatii in asteptare",
      noOutstandingInvitations: "Nu exista invitatii active.",
      invitationWaitingSingular: "{count} invitatie asteapta sa fie acceptata.",
      invitationWaitingPlural: "{count} invitatii asteapta sa fie acceptate.",
      nothingHereYet: "Nu exista nimic aici momentan.",
      revoke: "Revoca",
      revokeConfirm: "Revoci invitatia pentru {email}?",
      expires: "Expira la {date}",
      history: "Istoric",
      historyDescription: "Invitatii acceptate sau expirate.",
      redeemed: "Acceptata la {date}",
      expired: "Expirata la {date}",
      inviteMember: "Invita membru",
      inviteDialogTitle: "Invita un membru al echipei",
      inviteDialogDescription:
        "Va primi un email cu un link pentru setarea parolei. Linkul expira in 72 de ore.",
      inviteCreated: "Invitatia a fost creata pentru {email}.",
      inviteEmailSentSuffix: "A fost trimis un email.",
      inviteManualShareSuffix:
        "Nu exista un provider de email configurat - distribuie manual linkul de mai jos.",
      acceptLink: "Link de acceptare",
      copied: "Copiat",
      copy: "Copiaza",
      done: "Gata",
      errorCouldNotSendInvitation: "Invitatia nu a putut fi trimisa",
      emailLabel: "Email",
      emailPlaceholder: "coleg@example.com",
      cancel: "Anuleaza",
      sendInvitation: "Trimite invitatia",
    },
  },
}
