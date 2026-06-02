/**
 * 世界总览面板 — 管理多个世界组 + 世界关系
 */
import { useState, useEffect } from 'react'
import { Plus, Trash2, GripVertical, ArrowRight, ChevronRight } from 'lucide-react'
import { useWorldGroupStore } from '../../stores/world-group'
import { WORLD_GROUP_TYPE_LABELS } from '../../lib/types/world-group'
import type { Project, WorldGroup, WorldGroupType } from '../../lib/types'
import WorldGroupDetail from './WorldGroupDetail'

interface Props {
  project: Project
}

export default function WorldGroupOverview({ project }: Props) {
  const { groups, links, loading, loadAll, createGroup, deleteGroup, ensurePrimaryGroup } = useWorldGroupStore()
  const [editingGroup, setEditingGroup] = useState<WorldGroup | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  useEffect(() => {
    if (!project.id) return
    loadAll(project.id).then(() => ensurePrimaryGroup(project.id!))
  }, [project.id, loadAll, ensurePrimaryGroup])

  const handleAddWorld = async () => {
    const id = await createGroup({
      projectId: project.id!,
      name: '新世界',
      description: '',
      type: 'traversal' as WorldGroupType,
      icon: '🌐',
      order: groups.length,
    })
    // 自动进入编辑
    const created = groups.find(g => g.id === id) ||
      { id, projectId: project.id!, name: '新世界', description: '', type: 'traversal' as WorldGroupType, icon: '🌐', order: groups.length, createdAt: Date.now(), updatedAt: Date.now() }
    setEditingGroup(created)
  }

  const handleDelete = async (id: number) => {
    await deleteGroup(id)
    setConfirmDeleteId(null)
  }

  // 如果正在编辑某个世界，显示详情
  if (editingGroup) {
    const latest = groups.find(g => g.id === editingGroup.id) || editingGroup
    return (
      <div className="max-w-3xl mx-auto">
        <WorldGroupDetail
          group={latest}
          onBack={() => setEditingGroup(null)}
        />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 顶部标题 */}
      <div className="pb-4 border-b border-border/40">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          🌐 世界总览
        </h2>
        <p className="text-xs text-text-muted mt-0.5">
          管理多个世界的设定，定义世界间的穿越关系。每个世界拥有独立的世界观、力量体系、地理和历史。
        </p>
      </div>

      {loading ? (
        <div className="text-text-muted text-sm py-8 text-center">加载中...</div>
      ) : (
        <>
          {/* 世界列表 */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">世界列表 ({groups.length})</h3>
              <button
                onClick={handleAddWorld}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                添加世界
              </button>
            </div>

            <div className="space-y-1">
              {groups.map(g => (
                <div
                  key={g.id}
                  className="flex items-center gap-3 px-3 py-2.5 bg-bg-surface border border-border rounded-lg hover:border-accent/30 transition-colors group"
                >
                  <GripVertical className="w-4 h-4 text-text-muted/30 shrink-0 cursor-grab" />

                  {/* 图标 + 颜色指示 */}
                  <span className="text-xl shrink-0">{g.icon || '🌐'}</span>

                  {/* 信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary truncate">{g.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-bg-elevated text-text-muted border border-border/50">
                        {WORLD_GROUP_TYPE_LABELS[g.type]}
                      </span>
                    </div>
                    {g.description && (
                      <p className="text-xs text-text-muted truncate mt-0.5">{g.description}</p>
                    )}
                  </div>

                  {/* 预计章节 */}
                  {g.plannedChapterCount ? (
                    <span className="text-xs text-text-muted shrink-0">{g.plannedChapterCount} 章</span>
                  ) : null}

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingGroup(g)}
                      className="p-1.5 rounded text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                      title="编辑"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    {g.type !== 'primary' && (
                      confirmDeleteId === g.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(g.id!)}
                            className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                          >
                            确认删除
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-0.5 text-xs text-text-muted hover:text-text-primary transition-colors"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(g.id!)}
                          className="p-1.5 rounded text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="删除世界"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>

            {groups.length === 0 && (
              <div className="text-center py-8 text-text-muted text-sm">
                暂无世界组，点击上方按钮添加
              </div>
            )}
          </section>

          {/* 世界关系 */}
          {links.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-text-primary">世界关系</h3>
              <div className="space-y-1">
                {links.map(l => {
                  const from = groups.find(g => g.id === l.fromGroupId)
                  const to = groups.find(g => g.id === l.toGroupId)
                  return (
                    <div key={l.id} className="flex items-center gap-2 px-3 py-2 bg-bg-surface border border-border rounded-lg text-sm">
                      <span>{from?.icon} {from?.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
                      <span>{to?.icon} {to?.name}</span>
                      {l.name && <span className="text-text-muted">（{l.name}）</span>}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* 穿越总览 */}
          {groups.filter(g => g.type !== 'primary').length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-text-primary">穿越总览</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-xs font-medium text-text-muted">世界</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-text-muted">类型</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-text-muted">预计章节</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-text-muted">进入条件</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-text-muted">能力限制</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.filter(g => g.type !== 'primary').map(g => (
                      <tr key={g.id} className="border-b border-border/50 hover:bg-bg-hover/50 transition-colors">
                        <td className="py-2 px-3">
                          <span className="flex items-center gap-1.5">
                            <span>{g.icon}</span>
                            <span className="text-text-primary">{g.name}</span>
                          </span>
                        </td>
                        <td className="py-2 px-3 text-text-muted text-xs">{WORLD_GROUP_TYPE_LABELS[g.type]}</td>
                        <td className="py-2 px-3 text-text-muted">{g.plannedChapterCount || '—'}</td>
                        <td className="py-2 px-3 text-text-muted text-xs truncate max-w-[200px]">{g.entryCondition || '—'}</td>
                        <td className="py-2 px-3 text-text-muted text-xs truncate max-w-[200px]">{g.powerRestriction || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
