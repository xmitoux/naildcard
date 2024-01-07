export const useClipboardCopy = () => {
    const copying = ref(false);
    const copyToClipboard = async (targetString: string) => {
        copying.value = true;

        try {
            await navigator.clipboard.writeText(targetString);
            ElMessage.success({
                message: 'Copied!',
                onClose() {
                    copying.value = false;
                },
                duration: 1500,
            });
        } catch {
            ElMessage.error({
                message: 'Copy Failed...',
                onClose() {
                    copying.value = false;
                },
            });
        }
    };

    return {
        copying,
        copyToClipboard,
    };
};
