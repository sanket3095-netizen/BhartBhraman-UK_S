/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Member, Expense, Transfer, MemberBalance, FamilyBalance, Family, Settlement } from "../types";

/**
 * Calculates net balances for every member during the trip
 */
export function calculateBalances(
  members: Member[],
  families: Family[],
  expenses: Expense[],
  transfers: Transfer[]
): { memberBalances: MemberBalance[]; familyBalances: FamilyBalance[] } {
  const memberBalances: Record<string, { paid: number; owed: number }> = {};

  // Initialize
  members.forEach(m => {
    memberBalances[m.id] = { paid: 0, owed: 0 };
  });

  // Roll up expenses
  expenses.forEach(exp => {
    // 1. Roll up who paid
    if (exp.multiplePayers) {
      Object.entries(exp.multiplePayers).forEach(([payerId, amt]) => {
        if (memberBalances[payerId]) {
          memberBalances[payerId].paid += amt;
        }
      });
    } else {
      if (memberBalances[exp.paidBy]) {
        memberBalances[exp.paidBy].paid += exp.amount;
      }
    }

    // 2. Roll up who owes
    exp.participants.forEach(p => {
      if (memberBalances[p.memberId]) {
        memberBalances[p.memberId].owed += p.amount;
      }
    });
  });

  // Roll up transfers: direct peer-to-peer repayments
  // Transfers alter the "paid" amount (repaying increases your paid standing or reduces your debtor status)
  // To keep it simple: if A transfers to B, A is credited (gets closer to being even, count as 'paid')
  // and B is debited (they received cash, so they count as having received matching payments).
  // In Splitwise terms: A transfer from A to B means A's balance increases, B's balance decreases.
  transfers.forEach(t => {
    if (memberBalances[t.from]) {
      // 'from' paid money to 'to', so they get credit (increases net balance)
      memberBalances[t.from].paid += t.amount;
    }
    if (memberBalances[t.to]) {
      // 'to' received cash, so they owe more or get less credit (reduces net balance, effectively increases 'owed' or reduces 'paid')
      memberBalances[t.to].owed += t.amount;
    }
  });

  // Format response for members
  const memberResult: MemberBalance[] = members.map(m => {
    const b = memberBalances[m.id];
    return {
      memberId: m.id,
      paid: b.paid,
      owed: b.owed,
      net: parseFloat((b.paid - b.owed).toFixed(2))
    };
  });

  // Roll up for families
  const familyBalancesRecord: Record<string, { paid: number; owed: number }> = {};
  families.forEach(f => {
    familyBalancesRecord[f.id] = { paid: 0, owed: 0 };
  });

  members.forEach(m => {
    const mb = memberBalances[m.id];
    const famId = m.familyId;
    if (familyBalancesRecord[famId]) {
      familyBalancesRecord[famId].paid += mb.paid;
      familyBalancesRecord[famId].owed += mb.owed;
    }
  });

  const familyResult: FamilyBalance[] = families.map(f => {
    const b = familyBalancesRecord[f.id];
    return {
      familyId: f.id,
      familyName: f.name,
      paid: b.paid,
      owed: b.owed,
      net: parseFloat((b.paid - b.owed).toFixed(2))
    };
  });

  return {
    memberBalances: memberResult,
    familyBalances: familyResult
  };
}

/**
 * Greedy Simplify Debt Algorithm
 * Matches the largest debtor with the largest creditor to minimize peer transactions
 */
export function simplifyDebts(
  memberBalances: MemberBalance[],
  members: Member[]
): Settlement[] {
  // Use deep copies
  const balances = memberBalances.map(mb => ({
    memberId: mb.memberId,
    net: mb.net
  })).filter(b => Math.abs(b.net) > 0.1); // ignore negligible balances

  const settlements: Settlement[] = [];
  const maxIterations = 100; // safety brake
  let iter = 0;

  const getMemberName = (id: string) => {
    return members.find(m => m.id === id)?.name || id;
  };

  while (balances.length > 1 && iter < maxIterations) {
    iter++;
    // Sort so largest debtor is first, largest creditor is last
    balances.sort((a, b) => a.net - b.net);

    const debtor = balances[0];
    const creditor = balances[balances.length - 1];

    if (Math.abs(debtor.net) < 0.1 || Math.abs(creditor.net) < 0.1) {
      break;
    }

    const debitAmount = Math.abs(debtor.net);
    const creditAmount = creditor.net;
    const settleAmount = parseFloat(Math.min(debitAmount, creditAmount).toFixed(2));

    debtor.net += settleAmount;
    creditor.net -= settleAmount;

    settlements.push({
      from: debtor.memberId,
      to: creditor.memberId,
      amount: settleAmount,
      reason: "Trip Debt Settlement",
      status: "pending"
    });

    // Filter out settled people
    for (let i = balances.length - 1; i >= 0; i--) {
      if (Math.abs(balances[i].net) < 0.1) {
        balances.splice(i, 1);
      }
    }
  }

  return settlements;
}

/**
 * Calculates share splits based on rules
 */
export function calculateSplits(
  amount: number,
  splitType: string,
  allMembers: Member[],
  selectedMemberIds: string[],
  customShares?: Record<string, number> // can hold weights, percentages, or custom amounts
): Record<string, number> {
  const result: Record<string, number> = {};
  const activeMembers = allMembers.filter(m => selectedMemberIds.includes(m.id));

  if (activeMembers.length === 0) return {};

  switch (splitType) {
    case "EQUAL":
    default: {
      const share = parseFloat((amount / activeMembers.length).toFixed(2));
      let distributed = 0;
      activeMembers.forEach((m, idx) => {
        if (idx === activeMembers.length - 1) {
          result[m.id] = parseFloat((amount - distributed).toFixed(2));
        } else {
          result[m.id] = share;
          distributed += share;
        }
      });
      break;
    }

    case "FAMILY_WISE": {
      // Split amount equally by families participating, then split within families
      const familiesRepresented = Array.from(new Set(activeMembers.map(m => m.familyId)));
      const familyShare = amount / familiesRepresented.length;

      familiesRepresented.forEach(famId => {
        const famMembers = activeMembers.filter(m => m.familyId === famId);
        const memberShare = parseFloat((familyShare / famMembers.length).toFixed(2));
        let famDistributed = 0;

        famMembers.forEach((m, idx) => {
          if (idx === famMembers.length - 1) {
            result[m.id] = parseFloat((familyShare - famDistributed).toFixed(2));
          } else {
            result[m.id] = memberShare;
            famDistributed += memberShare;
          }
        });
      });
      break;
    }

    case "COUPLE_WISE": {
      // Split equally among couples (assume 2 people per couple represent 1 unit)
      // Family 2 has Milind & Vaishali, Family 3 has Sharad & Sharayu
      // Family 1 splits Couples (Sanket & Sneha) vs Seniors (Shripad & Shruti)
      // Group active members into units
      const units: Record<string, string[]> = {
        "couple-sanket": ["m-sanket", "m-sneha"],
        "couple-seniors": ["m-shripad", "m-shruti"],
        "couple-milind": ["m-milind", "m-vaishali"],
        "couple-sharad": ["m-sharad", "m-sharayu"]
      };

      const participatingUnits: string[] = [];
      Object.entries(units).forEach(([unitKey, mIds]) => {
        const isPart = mIds.some(id => selectedMemberIds.includes(id));
        if (isPart) participatingUnits.push(unitKey);
      });

      if (participatingUnits.length === 0) return {};

      const unitShare = amount / participatingUnits.length;
      participatingUnits.forEach(unitKey => {
        const matchingIdsInSplit = units[unitKey].filter(id => selectedMemberIds.includes(id));
        const memberShare = parseFloat((unitShare / matchingIdsInSplit.length).toFixed(2));
        let unitDistributed = 0;

        matchingIdsInSplit.forEach((id, idx) => {
          if (idx === matchingIdsInSplit.length - 1) {
            result[id] = parseFloat((unitShare - unitDistributed).toFixed(2));
          } else {
            result[id] = memberShare;
            unitDistributed += memberShare;
          }
        });
      });
      break;
    }

    case "EXACT_AMOUNT": {
      let sumPaid = 0;
      allMembers.forEach(m => {
        const customAmt = customShares?.[m.id] || 0;
        result[m.id] = parseFloat(customAmt.toFixed(2));
        sumPaid += result[m.id];
      });
      // Adjust last person if there's any rounding deviation
      break;
    }

    case "PERCENTAGE": {
      let sumPct = 0;
      let distributed = 0;
      activeMembers.forEach((m, idx) => {
        const pct = customShares?.[m.id] || 0;
        sumPct += pct;
        if (idx === activeMembers.length - 1) {
          result[m.id] = parseFloat((amount - distributed).toFixed(2));
        } else {
          const share = parseFloat(((amount * pct) / 100).toFixed(2));
          result[m.id] = share;
          distributed += share;
        }
      });
      break;
    }

    case "WEIGHTED": {
      let totalWeight = 0;
      activeMembers.forEach(m => {
        totalWeight += customShares?.[m.id] || 1; // default to weight 1
      });

      if (totalWeight === 0) totalWeight = activeMembers.length;

      let distributed = 0;
      activeMembers.forEach((m, idx) => {
        const weight = customShares?.[m.id] || 1;
        if (idx === activeMembers.length - 1) {
          result[m.id] = parseFloat((amount - distributed).toFixed(2));
        } else {
          const share = parseFloat(((amount * weight) / totalWeight).toFixed(2));
          result[m.id] = share;
          distributed += share;
        }
      });
      break;
    }
  }

  // Backfill with 0 for non-participating members
  allMembers.forEach(m => {
    if (result[m.id] === undefined) {
      result[m.id] = 0;
    }
  });

  return result;
}
