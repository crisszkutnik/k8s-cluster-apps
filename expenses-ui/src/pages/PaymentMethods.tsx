import { usePaymentMethodStore } from "../lib/stores/paymentMethodStore";
import { EditPaymentMethodModal } from "../components/EditPaymentMethodModal";
import { NewPaymentMethodModal } from "../components/NewPaymentMethodModal";

export function PaymentMethods() {
  const paymentMethods = usePaymentMethodStore((state) => state.paymentMethods);
  const addPaymentMethod = usePaymentMethodStore((state) => state.addPaymentMethod);
  const updatePaymentMethod = usePaymentMethodStore((state) => state.updatePaymentMethod);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payment Methods</h1>
          <p className="text-muted-foreground">Manage your payment methods</p>
        </div>
        <NewPaymentMethodModal onCreated={addPaymentMethod} />
      </div>

      <div className="rounded-lg border border-slate-700 overflow-hidden">
        {paymentMethods.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No payment methods yet. Add one to get started.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/50">
                <th className="text-left px-4 py-3 font-medium text-gray-400">Name</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {paymentMethods.map((pm, index) => (
                <tr
                  key={pm.id}
                  className={`${
                    index < paymentMethods.length - 1 ? "border-b border-slate-700/50" : ""
                  } hover:bg-slate-800/30 transition-colors`}
                >
                  <td className="px-4 py-3 font-medium">{pm.name}</td>
                  <td className="px-4 py-3 text-right">
                    <EditPaymentMethodModal paymentMethod={pm} onUpdated={updatePaymentMethod} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
