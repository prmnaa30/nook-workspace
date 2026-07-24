<template>
	<div
		v-if="activeNote"
		class="flex-1 flex flex-col bg-slate-900/40 border border-slate-700/50 rounded-xl overflow-hidden shadow-lg backdrop-blur-md h-full min-h-[500px]"
	>
		<!-- Canvas Editor -->
		<div class="flex-1 overflow-y-auto overscroll-contain custom-scrollbar">
			<UEditor
				v-model="noteContent"
				v-slot="{ editor, handlers }"
				contentType="markdown"
				@update:modelValue="debouncedSave"
				:ui="{ base: 'pl-12 pr-8 pt-10 sm:pl-16 sm:pr-12' }"
				:extensions="editorExtensions"
				:handlers="customHandlers"
				:starter-kit="{
					link: { enableClickSelection: false, openOnClick: 'whenNotEditable' },
				}"
				placeholder="Start writing..."
				class="w-full relative"
			>
				<div
					class="flex items-center justify-between border-b sticky top-0 border-slate-800/50 bg-slate-950 z-10 px-12 py-2 mb-4 rounded-lg gap-4"
				>
					<UEditorToolbar
						:editor="editor"
						:items="fixedToolbarItems"
						class="flex-1 overflow-x-auto border-0 bg-transparent p-0 m-0"
					>
						<template #link>
							<EditorLinkPopover
								:editor="editor"
								auto-open
							/>
						</template>
					</UEditorToolbar>

					<div class="flex items-center gap-2 shrink-0">
						<transition
							name="fade"
							mode="out-in"
						>
							<span
								v-if="isSaving"
								class="text-xs text-slate-400 flex items-center gap-1.5 mr-2 select-none"
							>
								<svg
									class="animate-spin h-3.5 w-3.5 text-slate-400"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								Saving...
							</span>
							<span
								v-else
								class="text-xs text-slate-500 flex items-center gap-1 mr-2 select-none"
							>
								<svg
									class="h-3.5 w-3.5 text-emerald-500"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2.5"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M5 13l4 4L19 7"
									/>
								</svg>
								Saved
							</span>
						</transition>
						<UButton
							icon="i-lucide-trash-2"
							variant="ghost"
							size="sm"
							class="hover:text-red-400 hover:bg-red-500/20 cursor-pointer"
							title="Delete Note"
							@click="emit('delete')"
						/>
						<UButton
							icon="i-lucide-x"
							variant="soft"
							size="sm"
							class="cursor-pointer"
							title="Close Note"
							@click="emit('back')"
						/>
					</div>
				</div>

				<UEditorToolbar
					:editor="editor"
					:items="bubbleToolbarItems"
					layout="bubble"
					:should-show="
						({ editor, view, state }) => {
							if (editor.isActive('imageUpload') || editor.isActive('image')) {
								return false;
							}
							const { selection } = state;
							return view.hasFocus() && !selection.empty;
						}
					"
				>
					<template #link>
						<EditorLinkPopover :editor="editor" />
					</template>
				</UEditorToolbar>

				<UEditorToolbar
					:editor="editor"
					:items="imageToolbarItems(editor)"
					layout="bubble"
					:should-show="
						({ editor, view }) => {
							return editor.isActive('image') && view.hasFocus();
						}
					"
				/>

				<UEditorDragHandle
					v-slot="{ ui, onClick }"
					:editor="editor"
					@node-change="selectedNode = $event"
				>
					<UButton
						icon="i-lucide-plus"
						color="neutral"
						variant="ghost"
						size="sm"
						:class="ui.handle()"
						@click="
							(e) => {
								e.stopPropagation();
								const selected = onClick();
								handlers.suggestion?.execute(editor, { pos: selected?.pos }).run();
							}
						"
					/>

					<UDropdownMenu
						v-slot="{ open }"
						:modal="false"
						:items="handleItems(editor)"
						:content="{ side: 'left' }"
						:ui="{
							content: 'w-48 bg-slate-900 border border-slate-800',
							label: 'text-xs text-slate-300',
						}"
						@update:open="editor.chain().setMeta('lockDragHandle', $event).run()"
					>
						<UButton
							color="neutral"
							variant="ghost"
							active-variant="soft"
							size="sm"
							icon="i-lucide-grip-vertical"
							:active="open"
							:class="ui.handle()"
						/>
					</UDropdownMenu>
				</UEditorDragHandle>

				<UEditorSuggestionMenu
					:editor="editor"
					:items="suggestionItems"
				/>
			</UEditor>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { invoke } from "@tauri-apps/api/core";
import type { Workspace } from "../../services/workspaces.service";
import type { EditorCustomHandlers, EditorToolbarItem, EditorSuggestionMenuItem } from "@nuxt/ui";
import { Editor } from "@tiptap/vue-3";
import type { JSONContent } from "@tiptap/vue-3";
import { useNoteStore } from "../../stores/notes";
import { storeToRefs } from "pinia";
import ImageUpload from "../../lib/EditorImageUploadExtension";
import TextAlign from "@tiptap/extension-text-align";
import EditorLinkPopover from "./EditorLinkPopover.vue";
import { mapEditorItems } from "@nuxt/ui/utils/editor";
import { DOMSerializer } from "@tiptap/pm/model";
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { marked } from "marked";
import { CodeBlockShiki } from "tiptap-extension-code-block-shiki";

const MarkdownPaste = Extension.create({
	name: "markdownPaste",
	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey("markdownPaste"),
				props: {
					handlePaste: (_view, event) => {
						const clipboardData = event.clipboardData;
						if (!clipboardData) return false;

						if (clipboardData.files && clipboardData.files.length > 0) {
							return false;
						}

						const html = clipboardData.getData("text/html");
						if (html && html.trim()) {
							return false;
						}

						const text = clipboardData.getData("text/plain");
						if (!text || !text.trim()) return false;

						try {
							const htmlContent = marked.parse(text, { async: false }) as string;
							if (htmlContent && htmlContent.trim()) {
								this.editor.commands.insertContent(htmlContent);
								return true;
							}
						} catch (err) {
							console.error("Failed to parse pasted markdown:", err);
						}

						return false;
					},
				},
			}),
		];
	},
});

const props = defineProps<{
	workspace: Workspace | null;
}>();

const emit = defineEmits<{
	(e: "back"): void;
	(e: "delete"): void;
}>();

const store = useNoteStore();
const { activeNote } = storeToRefs(store);

const noteContent = ref("");
const isSaving = ref(false);

const editorExtensions = [
	ImageUpload,
	TextAlign.configure({ types: ["heading", "paragraph"] }),
	MarkdownPaste,
	CodeBlockShiki.configure({
		defaultTheme: "material-theme-darker"
	}),
];

const selectedNode = ref<{ node: JSONContent; pos: number }>();

const customHandlers = {
	imageUpload: {
		canExecute: (editor: Editor) => editor.can().insertContent({ type: "imageUpload" }),
		execute: (editor: Editor) => editor.chain().focus().insertContent({ type: "imageUpload" }),
		isActive: (editor: Editor) => editor.isActive("imageUpload"),
		isDisabled: undefined,
	},
} satisfies EditorCustomHandlers;

const fixedToolbarItems = [
	[
		{
			kind: "undo",
			icon: "i-lucide-undo",
			tooltip: { text: "Undo" },
		},
		{
			kind: "redo",
			icon: "i-lucide-redo",
			tooltip: { text: "Redo" },
		},
	],
	[
		{
			icon: "i-lucide-heading",
			tooltip: { text: "Headings" },
			content: {
				align: "start",
			},
			items: [
				{
					kind: "heading",
					level: 1,
					icon: "i-lucide-heading-1",
					label: "Heading 1",
				},
				{
					kind: "heading",
					level: 2,
					icon: "i-lucide-heading-2",
					label: "Heading 2",
				},
				{
					kind: "heading",
					level: 3,
					icon: "i-lucide-heading-3",
					label: "Heading 3",
				},
				{
					kind: "heading",
					level: 4,
					icon: "i-lucide-heading-4",
					label: "Heading 4",
				},
			],
		},
		{
			icon: "i-lucide-list",
			tooltip: { text: "Lists" },
			content: {
				align: "start",
			},
			items: [
				{
					kind: "bulletList",
					icon: "i-lucide-list",
					label: "Bullet List",
				},
				{
					kind: "orderedList",
					icon: "i-lucide-list-ordered",
					label: "Ordered List",
				},
			],
		},
		{
			kind: "blockquote",
			icon: "i-lucide-text-quote",
			tooltip: { text: "Blockquote" },
		},
		{
			kind: "codeBlock",
			icon: "i-lucide-square-code",
			tooltip: { text: "Code Block" },
		},
	],
	[
		{
			kind: "mark",
			mark: "bold",
			icon: "i-lucide-bold",
			tooltip: { text: "Bold" },
		},
		{
			kind: "mark",
			mark: "italic",
			icon: "i-lucide-italic",
			tooltip: { text: "Italic" },
		},
		{
			kind: "mark",
			mark: "underline",
			icon: "i-lucide-underline",
			tooltip: { text: "Underline" },
		},
		{
			kind: "mark",
			mark: "strike",
			icon: "i-lucide-strikethrough",
			tooltip: { text: "Strikethrough" },
		},
		{
			kind: "mark",
			mark: "code",
			icon: "i-lucide-code",
			tooltip: { text: "Code" },
		},
	],
	[
		{
			slot: "link" as const,
			icon: "i-lucide-link",
		},
		{
			kind: "imageUpload",
			icon: "i-lucide-image",
			tooltip: { text: "Image" },
		},
	],
	[
		{
			icon: "i-lucide-align-justify",
			tooltip: { text: "Text Align" },
			content: {
				align: "end",
			},
			items: [
				{
					kind: "textAlign",
					align: "left",
					icon: "i-lucide-align-left",
					label: "Align Left",
				},
				{
					kind: "textAlign",
					align: "center",
					icon: "i-lucide-align-center",
					label: "Align Center",
				},
				{
					kind: "textAlign",
					align: "right",
					icon: "i-lucide-align-right",
					label: "Align Right",
				},
				{
					kind: "textAlign",
					align: "justify",
					icon: "i-lucide-align-justify",
					label: "Align Justify",
				},
			],
		},
	],
] satisfies EditorToolbarItem<typeof customHandlers>[][];

const bubbleToolbarItems = computed(
	() =>
		[
			[
				{
					label: "Turn into",
					trailingIcon: "i-lucide-chevron-down",
					activeColor: "neutral",
					activeVariant: "ghost",
					tooltip: { text: "Turn into" },
					content: {
						align: "start",
					},
					ui: {
						label: "text-xs",
					},
					items: [
						{
							type: "label",
							label: "Turn into",
						},
						{
							kind: "paragraph",
							label: "Paragraph",
							icon: "i-lucide-type",
						},
						{
							kind: "heading",
							level: 1,
							icon: "i-lucide-heading-1",
							label: "Heading 1",
						},
						{
							kind: "heading",
							level: 2,
							icon: "i-lucide-heading-2",
							label: "Heading 2",
						},
						{
							kind: "heading",
							level: 3,
							icon: "i-lucide-heading-3",
							label: "Heading 3",
						},
						{
							kind: "heading",
							level: 4,
							icon: "i-lucide-heading-4",
							label: "Heading 4",
						},
						{
							kind: "bulletList",
							icon: "i-lucide-list",
							label: "Bullet List",
						},
						{
							kind: "orderedList",
							icon: "i-lucide-list-ordered",
							label: "Ordered List",
						},
						{
							kind: "blockquote",
							icon: "i-lucide-text-quote",
							label: "Blockquote",
						},
						{
							kind: "codeBlock",
							icon: "i-lucide-square-code",
							label: "Code Block",
						},
					],
				},
			],
			[
				{
					kind: "mark",
					mark: "bold",
					icon: "i-lucide-bold",
					tooltip: { text: "Bold" },
				},
				{
					kind: "mark",
					mark: "italic",
					icon: "i-lucide-italic",
					tooltip: { text: "Italic" },
				},
				{
					kind: "mark",
					mark: "underline",
					icon: "i-lucide-underline",
					tooltip: { text: "Underline" },
				},
				{
					kind: "mark",
					mark: "strike",
					icon: "i-lucide-strikethrough",
					tooltip: { text: "Strikethrough" },
				},
				{
					kind: "mark",
					mark: "code",
					icon: "i-lucide-code",
					tooltip: { text: "Code" },
				},
			],
			[
				{
					slot: "link" as const,
					icon: "i-lucide-link",
				},
				{
					kind: "imageUpload",
					icon: "i-lucide-image",
					tooltip: { text: "Image" },
				},
			],
			[
				{
					icon: "i-lucide-align-justify",
					tooltip: { text: "Text Align" },
					content: {
						align: "end",
					},
					items: [
						{
							kind: "textAlign",
							align: "left",
							icon: "i-lucide-align-left",
							label: "Align Left",
						},
						{
							kind: "textAlign",
							align: "center",
							icon: "i-lucide-align-center",
							label: "Align Center",
						},
						{
							kind: "textAlign",
							align: "right",
							icon: "i-lucide-align-right",
							label: "Align Right",
						},
						{
							kind: "textAlign",
							align: "justify",
							icon: "i-lucide-align-justify",
							label: "Align Justify",
						},
					],
				},
			],
		] satisfies EditorToolbarItem<typeof customHandlers>[][],
);

const imageToolbarItems = (editor: Editor): EditorToolbarItem[][] => {
	const node = editor.state.doc.nodeAt(editor.state.selection.from);

	return [
		[
			{
				icon: "i-lucide-download",
				to: node?.attrs?.src,
				download: true,
				tooltip: { text: "Download" },
			},
			{
				icon: "i-lucide-refresh-cw",
				tooltip: { text: "Replace" },
				onClick: () => {
					const { state } = editor;
					const { selection } = state;

					const pos = selection.from;
					const node = state.doc.nodeAt(pos);

					if (node && node.type.name === "image") {
						editor
							.chain()
							.focus()
							.deleteRange({ from: pos, to: pos + node.nodeSize })
							.insertContentAt(pos, { type: "imageUpload" })
							.run();
					}
				},
			},
		],
		[
			{
				icon: "i-lucide-trash",
				tooltip: { text: "Delete" },
				onClick: () => {
					const { state } = editor;
					const { selection } = state;

					const pos = selection.from;
					const node = state.doc.nodeAt(pos);

					if (node && node.type.name === "image") {
						editor
							.chain()
							.focus()
							.deleteRange({ from: pos, to: pos + node.nodeSize })
							.run();
					}
				},
			},
		],
	];
};

const handleItems = (editor: Editor): any[][] => {
	if (!selectedNode.value?.node?.type) {
		return [];
	}

	const typeName = selectedNode.value.node.type;
	const formattedType = typeName.charAt(0).toUpperCase() + typeName.slice(1);

	return mapEditorItems(
		editor,
		[
			[
				{
					type: "label",
					label: formattedType,
				},
				{
					label: "Turn into",
					icon: "i-lucide-arrow-left-right",
					children: [
						{ kind: "paragraph", label: "Paragraph", icon: "i-lucide-type" },
						{
							kind: "heading",
							level: 1,
							label: "Heading 1",
							icon: "i-lucide-heading-1",
						},
						{
							kind: "heading",
							level: 2,
							label: "Heading 2",
							icon: "i-lucide-heading-2",
						},
						{
							kind: "heading",
							level: 3,
							label: "Heading 3",
							icon: "i-lucide-heading-3",
						},
						{
							kind: "bulletList",
							label: "Bullet List",
							icon: "i-lucide-list",
						},
						{
							kind: "orderedList",
							label: "Ordered List",
							icon: "i-lucide-list-ordered",
						},
						{ kind: "blockquote", label: "Blockquote", icon: "i-lucide-quote" },
						{ kind: "codeBlock", label: "Code Block", icon: "i-lucide-code" },
					],
				},
				{
					kind: "clearFormatting",
					pos: selectedNode.value?.pos,
					label: "Reset formatting",
					icon: "i-lucide-eraser",
				},
			],
			[
				{
					kind: "duplicate",
					pos: selectedNode.value?.pos,
					label: "Duplicate",
					icon: "i-lucide-copy",
				},
				{
					label: "Copy to clipboard",
					icon: "i-lucide-clipboard",
					onSelect: async () => {
						if (!selectedNode.value) return;

						const pos = selectedNode.value.pos;
						const node = editor.state.doc.nodeAt(pos);
						if (node) {
							try {
								const tempDiv = document.createElement("div");
								const serializer = DOMSerializer.fromSchema(editor.schema);
								const fragment = serializer.serializeNode(node);
								tempDiv.appendChild(fragment);
								const htmlContent = tempDiv.innerHTML;
								const textContent = node.textContent || "";

								const clipboardData = [
									new ClipboardItem({
										"text/plain": new Blob([textContent], {
											type: "text/plain",
										}),
										"text/html": new Blob([htmlContent], {
											type: "text/html",
										}),
									}),
								];
								await navigator.clipboard.write(clipboardData);
							} catch (err) {
								console.error("Failed to copy formatted text:", err);
								await navigator.clipboard.writeText(node.textContent || "");
							}
						}
					},
				},
			],
			[
				{
					kind: "moveUp",
					pos: selectedNode.value?.pos,
					label: "Move up",
					icon: "i-lucide-arrow-up",
				},
				{
					kind: "moveDown",
					pos: selectedNode.value?.pos,
					label: "Move down",
					icon: "i-lucide-arrow-down",
				},
			],
			[
				{
					kind: "delete",
					pos: selectedNode.value?.pos,
					label: "Delete",
					icon: "i-lucide-trash-2",
				},
			],
		],
		customHandlers,
	) as any[][];
};

const suggestionItems: EditorSuggestionMenuItem<typeof customHandlers>[][] = [
	[
		{
			type: "label",
			label: "Style",
		},
		{
			kind: "paragraph",
			label: "Paragraph",
			icon: "i-lucide-type",
		},
		{
			kind: "heading",
			level: 1,
			label: "Heading 1",
			icon: "i-lucide-heading-1",
		},
		{
			kind: "heading",
			level: 2,
			label: "Heading 2",
			icon: "i-lucide-heading-2",
		},
		{
			kind: "heading",
			level: 3,
			label: "Heading 3",
			icon: "i-lucide-heading-3",
		},
		{
			kind: "bulletList",
			label: "Bullet List",
			icon: "i-lucide-list",
		},
		{
			kind: "orderedList",
			label: "Numbered List",
			icon: "i-lucide-list-ordered",
		},
		{
			kind: "blockquote",
			label: "Blockquote",
			icon: "i-lucide-quote",
		},
		{
			kind: "codeBlock",
			label: "Code Block",
			icon: "i-lucide-code",
		},
	],
	[
		{
			type: "label",
			label: "Insert",
		},
		{
			kind: "imageUpload",
			label: "Image",
			icon: "i-lucide-image",
		},
		{
			kind: "horizontalRule",
			label: "Horizontal Rule",
			icon: "i-lucide-minus",
		},
	],
];

watch(
	activeNote,
	async (newNote) => {
		if (newNote) {
			try {
				const wsId = props.workspace?.id || newNote.workspace_id;
				noteContent.value = await invoke("read_note", {
					workspaceId: wsId,
					filename: newNote.filename,
				});
			} catch (e) {
				console.error("Failed to read note file:", e);
			}
		} else {
			noteContent.value = "";
		}
	},
	{ immediate: true },
);

let timeout: ReturnType<typeof setTimeout>;
function debouncedSave() {
	isSaving.value = true;
	clearTimeout(timeout);
	timeout = setTimeout(async () => {
		if (props.workspace && activeNote.value) {
			try {
				await invoke("write_note", {
					workspaceId: props.workspace.id,
					filename: activeNote.value.filename,
					content: noteContent.value,
				});

				await store.touchNote(props.workspace.id, activeNote.value.id);
			} catch (e) {
				console.error("Failed to auto-save:", e);
			} finally {
				isSaving.value = false;
			}
		}
	}, 1000);
}
</script>
