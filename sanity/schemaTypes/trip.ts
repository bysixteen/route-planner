import { defineField, defineType } from 'sanity'

export const trip = defineType({
  name: 'trip',
  title: 'Trip',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'startDate',
      title: 'Start Date',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'endDate',
      title: 'End Date',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'maxDrivingMinutes',
      title: 'Max Driving Time (minutes)',
      type: 'number',
      initialValue: 240,
      description: 'Maximum driving time per day in minutes (default: 240 = 4 hours)',
      validation: (Rule) => Rule.min(60).max(720),
    }),
    defineField({
      name: 'vehicle',
      title: 'Vehicle',
      type: 'reference',
      to: [{ type: 'vehicle' }],
    }),
    defineField({
      name: 'stops',
      title: 'Stops',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'stop' }] }],
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Planning', value: 'planning' },
          { title: 'Booked', value: 'booked' },
          { title: 'In Progress', value: 'in-progress' },
          { title: 'Completed', value: 'completed' },
        ],
      },
      initialValue: 'planning',
    }),
    defineField({
      name: 'isPublic',
      title: 'Public',
      type: 'boolean',
      initialValue: false,
      description: 'Allow this trip to be shared publicly',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      startDate: 'startDate',
      media: 'coverImage',
      status: 'status',
    },
    prepare({ title, startDate, media, status }) {
      return {
        title,
        subtitle: `${startDate || 'No date'} • ${status || 'planning'}`,
        media,
      }
    },
  },
})
